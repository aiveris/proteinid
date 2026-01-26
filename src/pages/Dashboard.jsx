import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, ProgressBar, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { QUICK_SELECT_FOODS, calculateProtein } from '../data/quickSelectFoods';
import { searchUSDAFoods } from '../services/usdaApi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [todayEntries, setTodayEntries] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [proteinAmount, setProteinAmount] = useState('');
  const [totalProtein, setTotalProtein] = useState(0);
  const [goal, setGoal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Load today's data
  useEffect(() => {
    if (currentUser) {
      loadTodayData();
      loadUserGoal();
      loadMonthlyData();
    }
  }, [currentUser]);

  // Calculate protein when serving changes
  useEffect(() => {
    if (selectedFood && servingSize) {
      const calculated = calculateProtein(selectedFood.protein, parseInt(servingSize));
      setProteinAmount(calculated.toString());
    }
  }, [selectedFood, servingSize]);

  // Search USDA database with debounce
  useEffect(() => {
    // Don't search if food is already selected and name matches
    if (selectedFood && foodName === selectedFood.description) {
      return;
    }

    if (foodName.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      const results = await searchUSDAFoods(foodName);
      setSearchResults(results);
      setShowResults(true);
      setSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [foodName, selectedFood]);


  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const loadUserGoal = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.weight && data.gender) {
          // Simple calculation: weight * multiplier
          const multiplier = data.gender === 'male' ? 1.0 : 0.8;
          const calculatedGoal = Math.round(data.weight * multiplier);
          setGoal(calculatedGoal);
        }
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  const loadTodayData = async () => {
    try {
      const today = getTodayDate();
      const entriesRef = collection(db, 'daily_logs');
      const q = query(
        entriesRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', today)
      );
      
      const snapshot = await getDocs(q);
      const entries = [];
      let total = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({ id: doc.id, ...data });
        total += parseFloat(data.protein_amount) || 0;
      });
      
      setTodayEntries(entries);
      setTotalProtein(total);
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const firstDateStr = firstDay.toISOString().split('T')[0];
      const lastDateStr = lastDay.toISOString().split('T')[0];
      
      const entriesRef = collection(db, 'daily_logs');
      // Simple query without range - works without index
      const q = query(
        entriesRef,
        where('user_id', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const dailyTotals = {};
      
      // Initialize all days of month with 0
      for (let d = 1; d <= lastDay.getDate(); d++) {
        dailyTotals[d] = 0;
      }
      
      // Sum protein for each day - filter by date in JavaScript
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include dates from current month
        if (data.date && data.date >= firstDateStr && data.date <= lastDateStr) {
          const day = parseInt(data.date.split('-')[2]);
          if (day >= 1 && day <= lastDay.getDate()) {
            dailyTotals[day] += parseFloat(data.protein_amount) || 0;
          }
        }
      });
      
      // Convert to array for chart
      const dataArray = Object.keys(dailyTotals)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(day => ({
          day: parseInt(day),
          protein: Math.round(dailyTotals[day])
        }));
      
      setMonthlyData(dataArray);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const handleQuickSelect = (key, food) => {
    setSelectedFood(food);
    setFoodName(food.description);
    setServingSize(food.serving.toString());
  };

  const handleUSDASelect = (food) => {
    const usdaFood = {
      description: food.description,
      protein: food.protein,
      serving: 100
    };
    setSelectedFood(usdaFood);
    setFoodName(food.description);
    setServingSize('100');
    setProteinAmount(food.protein.toFixed(1));
    setShowResults(false);
    setSearchResults([]);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    
    if (!foodName || !proteinAmount || !servingSize) {
      alert('Prašome užpildyti visus laukus');
      return;
    }
    
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'daily_logs'), {
        user_id: currentUser.uid,
        food_name: foodName,
        serving_size: servingSize + 'g',
        protein_amount: parseFloat(proteinAmount),
        date: getTodayDate(),
        timestamp: new Date().toISOString()
      });
      
      // Reset form
      setFoodName('');
      setServingSize('100');
      setProteinAmount('');
      setSelectedFood(null);
      
      // Reload data
      await loadTodayData();
      await loadMonthlyData();
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Klaida pridedant produktą');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Ar tikrai norite ištrinti šį įrašą?')) return;
    
    try {
      await deleteDoc(doc(db, 'daily_logs', entryId));
      await loadTodayData();
      await loadMonthlyData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Klaida trinant įrašą');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const progressPercentage = Math.min(Math.round((totalProtein / goal) * 100), 100);
  const progressVariant = 
    progressPercentage >= 100 ? 'success' :
    progressPercentage >= 75 ? 'info' :
    progressPercentage >= 50 ? 'warning' : 'danger';

  const emoji = 
    progressPercentage >= 100 ? '🎉' :
    progressPercentage >= 75 ? '💪' :
    progressPercentage >= 50 ? '👍' :
    progressPercentage >= 25 ? '🏃' : '🥚';

  const motivationText = 
    progressPercentage >= 100 ? 'Tikslas pasiektas!' :
    progressPercentage >= 75 ? 'Beveik ten!' :
    progressPercentage >= 50 ? 'Puikus progresas!' : 'Tęskite!';

  // Chart configuration
  const chartData = {
    labels: monthlyData.map(d => d.day),
    datasets: [
      {
        label: 'Baltymai (g)',
        data: monthlyData.map(d => d.protein),
        borderColor: 'rgb(13, 110, 253)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Tikslas',
        data: monthlyData.map(() => goal),
        borderColor: 'rgba(220, 53, 69, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'g';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light shadow-sm">
        <Container>
          <span 
            className="navbar-brand mb-0 h1" 
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            ProteinID
          </span>
          <div className="d-flex align-items-center">
            <span className="navbar-text me-3 d-none d-md-inline">{userProfile?.name?.split(' ')[0]}</span>
            
            {/* Desktop Navigation */}
            <Nav className="d-none d-md-flex">
              <Nav.Link onClick={() => navigate('/history')}>
                <i className="bi bi-clock-history me-1"></i>Istorija
              </Nav.Link>
              <Nav.Link onClick={() => navigate('/profile')}>
                <i className="bi bi-person-gear me-1"></i>Profilis
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>Atsijungti
              </Nav.Link>
            </Nav>

            {/* Mobile Navigation Dropdown */}
            <Dropdown className="d-md-none">
              <Dropdown.Toggle variant="light" id="mobile-menu">
                <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item className="text-muted small">{userProfile?.name?.split(' ')[0]}</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => navigate('/history')}>
                  <i className="bi bi-clock-history me-2"></i>Istorija
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <i className="bi bi-person-gear me-2"></i>Profilis
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>Atsijungti
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </nav>

      <Container className="py-2">
        {/* Progress Card */}
        <Card className="mb-2">
          <Card.Body className="py-2">
            <h6 className="fw-bold mb-2">Dienos progresas</h6>
            <div className="d-flex align-items-center gap-3">
              <div className="flex-grow-1">
                <ProgressBar 
                  now={progressPercentage} 
                  label={`${progressPercentage}%`}
                  variant={progressVariant}
                  className="mb-2"
                  style={{ height: '28px' }}
                />
                <p className="mb-0">
                  <span className="h5 fw-bold">{Math.round(totalProtein)}</span> g
                  {' / '}
                  <span className="h6">{Math.round(goal)}</span> g tikslas
                </p>
              </div>
              <div className="text-center" style={{ minWidth: '80px' }}>
                <div className="display-4">{emoji}</div>
                <small className="text-muted">{motivationText}</small>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Add Food Form */}
        <Card className="mb-2">
          <Card.Body className="p-2">
            {/* Quick Select Buttons */}
            <div className="quick-select-grid mb-2">
              {Object.entries(QUICK_SELECT_FOODS).map(([key, food]) => (
                <Button
                  key={key}
                  variant="outline-secondary"
                  className="quick-select-btn"
                  onClick={() => handleQuickSelect(key, food)}
                  title={`${food.description} (${food.protein}g/100g)`}
                >
                  <span>{food.icon}</span>
                </Button>
              ))}
            </div>

            <Form onSubmit={handleAddFood}>
              <Row className="g-2 mb-2">
                <Col xs={6}>
                  <Form.Label className="fw-bold small">Produkto pavadinimas</Form.Label>
                  <div className="position-relative usda-search-container">
                    <Form.Control
                      type="text"
                      value={foodName}
                      onChange={(e) => {
                        setFoodName(e.target.value);
                        // Clear selected food when user types
                        if (selectedFood && e.target.value !== selectedFood.description) {
                          setSelectedFood(null);
                        }
                      }}
                      placeholder="Pvz.: vištiena, bananas, pienas..."
                      required
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowResults(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowResults(false);
                        }, 200);
                      }}
                    />
                    {searching && (
                      <small className="text-muted d-block mt-1">
                        <i className="bi bi-search me-1"></i>
                        Ieškoma USDA duomenų bazėje...
                      </small>
                    )}
                    {showResults && searchResults.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                        {searchResults.map((food) => (
                          <div
                            key={food.fdcId}
                            className="p-2 border-bottom"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUSDASelect(food);
                            }}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div className="fw-bold" style={{ fontSize: '0.875rem' }}>{food.description}</div>
                            <small className="text-muted">
                              Baltymai: {food.protein.toFixed(1)}g / 100g
                              {food.brandName && ` • ${food.brandName}`}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label className="fw-bold small">Porcijos dydis (g)</Form.Label>
                  <Form.Select
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    required
                  >
                    {[...Array(30)].map((_, i) => {
                      const value = (i + 1) * 10;
                      return (
                        <option key={value} value={value}>{value}g</option>
                      );
                    })}
                  </Form.Select>
                </Col>
              </Row>
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Label className="fw-bold small">Baltymų kiekis (g)</Form.Label>
                  <Form.Control
                    type="number"
                    value={proteinAmount}
                    onChange={(e) => setProteinAmount(e.target.value)}
                    placeholder="0"
                    required
                    readOnly={!!selectedFood}
                  />
                </Col>
                <Col xs={6} className="d-flex align-items-end">
                  <Button 
                    variant="success" 
                    type="submit" 
                    className="w-100"
                    disabled={loading}
                  >
                    Pridėti
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Today's Entries */}
        <Card>
          <Card.Body>
            <h6 className="fw-bold mb-2">Šiandienos produktai</h6>
            {todayEntries.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-inbox display-1"></i>
                <p className="mt-2">Dar nepridėjote jokių produktų šiandien</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="table-sm mb-0" style={{ fontSize: '0.875rem', tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '15%' }}>Laikas</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '41%' }}>Produktas</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '16%' }}>Porcija</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '19%' }}>Baltymai</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '9%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayEntries.map((entry) => {
                      // Format timestamp to HH:MM
                      const time = entry.timestamp 
                        ? new Date(entry.timestamp).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{time}</td>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{entry.food_name}</td>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{entry.serving_size}</td>
                          <td className="fw-bold" style={{ padding: '0.3rem 0.375rem' }}>{Math.round(entry.protein_amount)} g</td>
                          <td className="text-center" style={{ padding: '0.3rem 0.375rem' }}>
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => handleDeleteEntry(entry.id)}
                              style={{ fontSize: '0.875rem' }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Monthly Chart */}
        <Card className="mt-2">
          <Card.Body>
            <h6 className="fw-bold mb-2">Mėnesio grafikas</h6>
            <div style={{ height: '200px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card.Body>
        </Card>
      </Container>

      <style>{`
        .navbar .nav-link {
          color: #000 !important;
          font-weight: bold;
        }
        
        .navbar .nav-link:hover {
          color: #333 !important;
        }
        
        .quick-select-grid {
          display: grid;
          grid-template-rows: repeat(2, 1fr);
          grid-auto-flow: column;
          gap: 0.38rem;
        }
        
        .quick-select-btn {
          aspect-ratio: auto;
          min-height: 60px;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-color: #dee2e6 !important;
          color: #495057;
        }
        
        .quick-select-btn:hover {
          transform: translateY(-2px);
          background-color: #f8f9fa;
          border-color: #ced4da !important;
        }
        
        .quick-select-btn span {
          font-size: 2rem;
        }
        
        @media (min-width: 768px) {
          .quick-select-btn {
            min-height: 50px;
          }
          .quick-select-btn span {
            font-size: 1.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .quick-select-btn {
            min-height: 55px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
