import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringType: 'monthly'
  });
  const [filter, setFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [savingsGoal, setSavingsGoal] = useState(5000);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [animatedNumbers, setAnimatedNumbers] = useState({ income: 0, expense: 0, balance: 0 });

  // Calculate totals (defined before useEffect)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // Animate numbers function
  const animateNumbers = useCallback(() => {
    // Animate income
    let startIncome = 0;
    const endIncome = totalIncome;
    const duration = 500;
    const step = Math.ceil(endIncome / (duration / 16));
    const interval = setInterval(() => {
      startIncome += step;
      if (startIncome >= endIncome) {
        setAnimatedNumbers(prev => ({ ...prev, income: endIncome }));
        clearInterval(interval);
      } else {
        setAnimatedNumbers(prev => ({ ...prev, income: startIncome }));
      }
    }, 16);

    // Animate expense
    let startExpense = 0;
    const endExpense = totalExpense;
    const interval2 = setInterval(() => {
      startExpense += step;
      if (startExpense >= endExpense) {
        setAnimatedNumbers(prev => ({ ...prev, expense: endExpense }));
        clearInterval(interval2);
      } else {
        setAnimatedNumbers(prev => ({ ...prev, expense: startExpense }));
      }
    }, 16);

    // Animate balance
    let startBalance = 0;
    const endBalance = balance;
    const interval3 = setInterval(() => {
      startBalance += Math.abs(step);
      if (Math.abs(startBalance) >= Math.abs(endBalance)) {
        setAnimatedNumbers(prev => ({ ...prev, balance: endBalance }));
        clearInterval(interval3);
      } else {
        setAnimatedNumbers(prev => ({ ...prev, balance: startBalance }));
      }
    }, 16);
  }, [totalIncome, totalExpense, balance]);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('budgetData');
    if (savedData) {
      setTransactions(JSON.parse(savedData));
    }
    const savedGoal = localStorage.getItem('savingsGoal');
    if (savedGoal) {
      setSavingsGoal(JSON.parse(savedGoal));
    }
  }, []);

  // Save to localStorage and animate
  useEffect(() => {
    localStorage.setItem('budgetData', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    animateNumbers();
  }, [animateNumbers]);

  const saveSavingsGoal = (goal) => {
    setSavingsGoal(goal);
    localStorage.setItem('savingsGoal', JSON.stringify(goal));
  };

  const addTransaction = () => {
    if (!formData.description || !formData.amount) return;
    
    const newTransaction = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    setTransactions([newTransaction, ...transactions]);
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringType: 'monthly'
    });
    setShowAddModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvData = transactions.map(t => [
      t.date, t.description, t.category, t.type, t.amount
    ]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imported = JSON.parse(e.target.result);
        setTransactions([...imported, ...transactions]);
      };
      reader.readAsText(file);
    }
  };

  const savingsProgress = Math.min((balance / savingsGoal) * 100, 100);

  // Category breakdown
  const categoryExpenses = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  // Filter transactions
  let filteredTransactions = [...transactions];
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === filter);
  }
  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (selectedCategory !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.category === selectedCategory);
  }
  
  filteredTransactions = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === selectedMonth && 
           transactionDate.getFullYear() === selectedYear;
  });

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2024, 2025, 2026];

  function getCategoryColor(category) {
    const colors = {
      Food: '#10B981',
      Transport: '#3B82F6',
      Shopping: '#EC4899',
      Entertainment: '#F59E0B',
      Bills: '#EF4444',
      Health: '#06B6D4',
      Education: '#8B5CF6',
      Other: '#2c384f'
    };
    return colors[category] || '#000000';
  }

  return (
    <div className="app">
      <div className="bg-gradient"></div>
      
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">💰</div>
            <div>
              <h1>Premium Budget</h1>
              <p>Financial Dashboard</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={exportToCSV} title="Export CSV">
              📊
            </button>
            <button className="icon-btn" onClick={exportToJSON} title="Backup Data">
              💾
            </button>
            <label className="icon-btn" title="Import Data">
              📁
              <input type="file" accept=".json" onChange={importFromJSON} style={{ display: 'none' }} />
            </label>
            <div className="header-stat">
              <span>Balance</span>
              <strong className={balance >= 0 ? 'positive' : 'negative'}>
                {formatMoney(animatedNumbers.balance)}
              </strong>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card income-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <span>Total Income</span>
              <strong>{formatMoney(animatedNumbers.income)}</strong>
              <div className="stat-trend">+12% from last month</div>
            </div>
          </div>
          <div className="stat-card expense-card">
            <div className="stat-icon">📉</div>
            <div className="stat-info">
              <span>Total Expenses</span>
              <strong>{formatMoney(animatedNumbers.expense)}</strong>
              <div className="stat-trend">-5% from last month</div>
            </div>
          </div>
          <div className="stat-card balance-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-info">
              <span>Net Balance</span>
              <strong className={balance >= 0 ? 'positive' : 'negative'}>
                {formatMoney(animatedNumbers.balance)}
              </strong>
            </div>
          </div>
          <div className="stat-card savings-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <span>Savings Goal</span>
              <strong>{formatMoney(savingsGoal)}</strong>
              <button className="edit-goal" onClick={() => {
                const newGoal = prompt('Set new savings goal:', savingsGoal);
                if (newGoal) saveSavingsGoal(parseFloat(newGoal));
              }}>✏️</button>
            </div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="savings-section">
          <div className="savings-header">
            <div>
              <span>🎯 SAVINGS PROGRESS</span>
              <h3>{formatMoney(balance)} of {formatMoney(savingsGoal)}</h3>
            </div>
            <div className="savings-percent">{Math.round(savingsProgress)}%</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${savingsProgress}%` }}>
              <div className="progress-glow"></div>
            </div>
          </div>
          {balance >= savingsGoal && (
            <div className="goal-achieved">
              🎉 Congratulations! You've reached your savings goal! 🎉
            </div>
          )}
        </div>

        {/* Category Mini */}
        <div className="category-mini">
          {Object.entries(categoryExpenses).slice(0, 4).map(([cat, amount]) => (
            <div key={cat} className="category-mini-item">
              <span>{cat}</span>
              <strong>{formatMoney(amount)}</strong>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="controls">
          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              📋 List
            </button>
            <button className={viewMode === 'charts' ? 'active' : ''} onClick={() => setViewMode('charts')}>
              📊 Charts
            </button>
          </div>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="date-filters">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All
          </button>
          <button className={filter === 'income' ? 'active' : ''} onClick={() => setFilter('income')}>
            💰 Income
          </button>
          <button className={filter === 'expense' ? 'active' : ''} onClick={() => setFilter('expense')}>
            💸 Expenses
          </button>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Main Content */}
        <div className="transactions-section">
          <div className="section-header">
            <h2>
              {viewMode === 'list' ? '📋 Transaction History' : '📊 Financial Analytics'}
              <span className="transaction-count">{filteredTransactions.length} entries</span>
            </h2>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              + Add Transaction
            </button>
          </div>
          
          {viewMode === 'list' ? (
            <div className="transactions-list">
              {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No transactions found</h3>
                  <p>Add your first transaction to get started</p>
                  <button onClick={() => setShowAddModal(true)}>+ Add Transaction</button>
                </div>
              ) : (
                filteredTransactions.map(transaction => (
                  <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                    <div className="transaction-info">
                      <div className="transaction-icon">
                        {transaction.type === 'income' ? '💰' : '💸'}
                      </div>
                      <div className="transaction-details">
                        <strong>{transaction.description}</strong>
                        <div className="transaction-meta">
                          <span className="transaction-category">{transaction.category}</span>
                          <span className="transaction-date">{new Date(transaction.date).toLocaleDateString()}</span>
                          {transaction.isRecurring && <span className="recurring-badge">🔄 Recurring</span>}
                        </div>
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <span className={transaction.type === 'income' ? 'income' : 'expense'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                      </span>
                      <button onClick={() => deleteTransaction(transaction.id)} className="delete-btn">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="charts-view">
              <div className="chart-container">
                <h3>📊 Category Breakdown</h3>
                <div className="simple-chart">
                  {Object.entries(categoryExpenses).map(([cat, amount]) => {
                    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                    return (
                      <div key={cat} className="chart-bar-item">
                        <div className="chart-label">
                          <span>{cat}</span>
                          <span>{formatMoney(amount)} ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="chart-bar-bg">
                          <div className="chart-bar-fill" style={{ width: `${percentage}%`, background: getCategoryColor(cat) }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="stats-summary">
                <div className="summary-card">
                  <h4>💰 Average Monthly Income</h4>
                  <p>{formatMoney(totalIncome / 12)}</p>
                </div>
                <div className="summary-card">
                  <h4>💸 Average Monthly Expense</h4>
                  <p>{formatMoney(totalExpense / 12)}</p>
                </div>
                <div className="summary-card">
                  <h4>📈 Savings Rate</h4>
                  <p>{totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="modal" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✨ Add New Transaction</h2>
                <button onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="type-selector">
                  <button 
                    className={formData.type === 'income' ? 'active' : ''}
                    onClick={() => setFormData({...formData, type: 'income'})}
                  >
                    💰 Income
                  </button>
                  <button 
                    className={formData.type === 'expense' ? 'active' : ''}
                    onClick={() => setFormData({...formData, type: 'expense'})}
                  >
                    💸 Expense
                  </button>
                </div>
                
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    autoFocus
                  />
                </div>
                
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                
                <div className="input-group">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                    />
                    🔄 Recurring Transaction
                  </label>
                  {formData.isRecurring && (
                    <select
                      value={formData.recurringType}
                      onChange={(e) => setFormData({...formData, recurringType: e.target.value})}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  )}
                </div>
                
                <button className="submit-btn" onClick={addTransaction}>
                  + Add Transaction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;