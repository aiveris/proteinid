import { useState, useEffect } from 'react';
import { Container, Card, Table, Nav, Dropdown, Row, Col, Form, ProgressBar, Modal, Button, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
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

const History = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [chartData, setChartData] = useState([]);
  const [allTimeStats, setAllTimeStats] = useState({ totalDays: 0, daysGoalReached: 0, averageProtein: 0 });
  const [goal, setGoal] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalEntries, setModalEntries] = useState([]);
  const [weightChartData, setWeightChartData] = useState([]);
  const [weightGoal, setWeightGoal] = useState(0);
  const [newWeight, setNewWeight] = useState('');
  const [newWeightGoal, setNewWeightGoal] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [latestWeight, setLatestWeight] = useState(null);
  const [lastEnteredWeight, setLastEnteredWeight] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeightEntry, setSelectedWeightEntry] = useState(null);
  const [editWeight, setEditWeight] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadUserGoal();
      loadChartData();
      loadWeightData();
      loadWeightGoal();
    }
  }, [currentUser, selectedYear, selectedMonth]);

  useEffect(() => {
    if (currentUser && goal) {
      loadAllTimeStats();
    }
  }, [currentUser, goal]);

  const loadUserGoal = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.weight && data.gender) {
          const multiplier = data.gender === 'male' ? 1.0 : 0.8;
          const calculatedGoal = Math.round(data.weight * multiplier);
          setGoal(calculatedGoal);
        }
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  const loadAllTimeStats = async () => {
    try {
      const entriesRef = collection(db, 'daily_logs');
      const q = query(
        entriesRef,
        where('user_id', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const dailyTotals = {};
      
      // Sum protein for each unique date
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date) {
          if (!dailyTotals[data.date]) {
            dailyTotals[data.date] = 0;
          }
          dailyTotals[data.date] += parseFloat(data.protein_amount) || 0;
        }
      });
      
      // Calculate statistics
      const daysArray = Object.values(dailyTotals).filter(protein => protein > 0);
      const totalDays = daysArray.length;
      const daysGoalReached = daysArray.filter(protein => protein >= goal).length;
      const totalProtein = daysArray.reduce((sum, protein) => sum + protein, 0);
      const averageProtein = totalDays > 0 ? Math.round(totalProtein / totalDays) : 0;
      
      setAllTimeStats({
        totalDays,
        daysGoalReached,
        averageProtein
      });
    } catch (error) {
      console.error('Error loading all-time stats:', error);
    }
  };

  const loadChartData = async () => {
    try {
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0);
      
      const firstDateStr = firstDay.toISOString().split('T')[0];
      const lastDateStr = lastDay.toISOString().split('T')[0];
      
      const entriesRef = collection(db, 'daily_logs');
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
      
      setChartData(dataArray);
    } catch (error) {
      console.error('Error loading chart data:', error);
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

  const loadWeightData = async () => {
    try {
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0);
      
      const firstDateStr = firstDay.toISOString().split('T')[0];
      const lastDateStr = lastDay.toISOString().split('T')[0];
      
      const weightRef = collection(db, 'weight_logs');
      const q = query(
        weightRef,
        where('user_id', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const dailyWeights = {};
      let latestWeightValue = null;
      let latestTimestamp = null;
      
      // Initialize all days of month with null
      for (let d = 1; d <= lastDay.getDate(); d++) {
        dailyWeights[d] = null;
      }
      
      // Get weight for each day - filter by date in JavaScript
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date && data.date >= firstDateStr && data.date <= lastDateStr) {
          const day = parseInt(data.date.split('-')[2]);
          if (day >= 1 && day <= lastDay.getDate()) {
            const weight = parseFloat(data.weight) || null;
            dailyWeights[day] = weight;
            
            // Find latest weight by timestamp
            if (weight !== null && data.timestamp) {
              const timestamp = new Date(data.timestamp).getTime();
              if (!latestTimestamp || timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                latestWeightValue = weight;
              }
            }
          }
        }
      });
      
      // If no weight in current month, find latest from all data
      if (latestWeightValue === null) {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.weight && data.timestamp) {
            const timestamp = new Date(data.timestamp).getTime();
            if (!latestTimestamp || timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestWeightValue = parseFloat(data.weight);
            }
          }
        });
      }
      
      // Convert to array for chart
      const dataArray = Object.keys(dailyWeights)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(day => ({
          day: parseInt(day),
          weight: dailyWeights[day]
        }));
      
      setWeightChartData(dataArray);
      setLatestWeight(latestWeightValue);
      setLastEnteredWeight(latestWeightValue);
    } catch (error) {
      console.error('Error loading weight data:', error);
    }
  };

  const loadWeightGoal = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.weight_goal) {
          setWeightGoal(data.weight_goal);
        }
      }
    } catch (error) {
      console.error('Error loading weight goal:', error);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) {
      alert('Įveskite teisingą svorį');
      return;
    }
    
    setWeightLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weightRef = collection(db, 'weight_logs');
      
      // Check if weight already exists for today
      const q = query(
        weightRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', today)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        // Update existing weight
        await updateDoc(existing.docs[0].ref, {
          weight: parseFloat(newWeight),
          timestamp: new Date().toISOString()
        });
      } else {
        // Add new weight
        await addDoc(weightRef, {
          user_id: currentUser.uid,
          weight: parseFloat(newWeight),
          date: today,
          timestamp: new Date().toISOString()
        });
      }
      
      setNewWeight('');
      await loadWeightData();
    } catch (error) {
      console.error('Error adding weight:', error);
      alert('Klaida pridedant svorį');
    } finally {
      setWeightLoading(false);
    }
  };

  const handleSetWeightGoal = async () => {
    if (!newWeightGoal || parseFloat(newWeightGoal) <= 0) {
      alert('Įveskite teisingą svorio tikslą');
      return;
    }
    
    setWeightLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        weight_goal: parseFloat(newWeightGoal)
      });
      
      setWeightGoal(parseFloat(newWeightGoal));
      setNewWeightGoal('');
    } catch (error) {
      console.error('Error setting weight goal:', error);
      alert('Klaida nustatant svorio tikslą');
    } finally {
      setWeightLoading(false);
    }
  };

  const handleWeightChartClick = async (event, elements) => {
    if (elements.length === 0) return;
    
    const element = elements[0];
    const datasetIndex = element.datasetIndex;
    
    // Only handle clicks on the weight dataset (index 0), not the goal line (index 1)
    if (datasetIndex !== 0) return;
    
    const dataIndex = element.index;
    const clickedDay = weightChartData[dataIndex];
    
    if (!clickedDay || clickedDay.weight === null || clickedDay.weight === undefined) {
      return;
    }
    
    // Find the date for this day
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(clickedDay.day).padStart(2, '0')}`;
    
    // Find the weight log entry
    try {
      const weightRef = collection(db, 'weight_logs');
      const q = query(
        weightRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateStr)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const entry = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        setSelectedWeightEntry(entry);
        setEditWeight(entry.weight.toString());
        setShowWeightModal(true);
      }
    } catch (error) {
      console.error('Error loading weight entry:', error);
    }
  };

  const handleEditWeight = async () => {
    if (!editWeight || parseFloat(editWeight) <= 0) {
      alert('Įveskite teisingą svorį');
      return;
    }
    
    if (!selectedWeightEntry) return;
    
    setWeightLoading(true);
    try {
      const weightRef = doc(db, 'weight_logs', selectedWeightEntry.id);
      await updateDoc(weightRef, {
        weight: parseFloat(editWeight),
        timestamp: new Date().toISOString()
      });
      
      setShowWeightModal(false);
      setSelectedWeightEntry(null);
      setEditWeight('');
      await loadWeightData();
    } catch (error) {
      console.error('Error editing weight:', error);
      alert('Klaida redaguojant svorį');
    } finally {
      setWeightLoading(false);
    }
  };

  const handleDeleteWeight = async () => {
    if (!selectedWeightEntry) return;
    
    if (!window.confirm('Ar tikrai norite ištrinti šį svorio įrašą?')) return;
    
    setWeightLoading(true);
    try {
      const weightRef = doc(db, 'weight_logs', selectedWeightEntry.id);
      await deleteDoc(weightRef);
      
      setShowWeightModal(false);
      setSelectedWeightEntry(null);
      setEditWeight('');
      await loadWeightData();
    } catch (error) {
      console.error('Error deleting weight:', error);
      alert('Klaida trinant svorio įrašą');
    } finally {
      setWeightLoading(false);
    }
  };

  const loadDayEntries = async (day) => {
    try {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entriesRef = collection(db, 'daily_logs');
      const q = query(
        entriesRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateStr)
      );
      
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by timestamp
      entries.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });
      
      setModalEntries(entries);
      setSelectedDate(dateStr);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading day entries:', error);
    }
  };

  const handleDeleteDayEntries = async () => {
    if (!selectedDate || modalEntries.length === 0) return;
    
    if (!window.confirm(`Ar tikrai norite ištrinti visus ${modalEntries.length} ${modalEntries.length === 1 ? 'įrašą' : 'įrašus'} šiai dienai?`)) return;
    
    try {
      // Delete all entries for this day
      const deletePromises = modalEntries.map(entry => 
        deleteDoc(doc(db, 'daily_logs', entry.id))
      );
      
      await Promise.all(deletePromises);
      
      // Close modal and reload data
      setShowModal(false);
      setModalEntries([]);
      setSelectedDate(null);
      await loadChartData();
      await loadAllTimeStats();
    } catch (error) {
      console.error('Error deleting day entries:', error);
      alert('Klaida trinant dienos įrašus');
    }
  };


  return (
    <div className="history-page">
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
              <Nav.Link onClick={() => navigate('/dashboard')}>
                <i className="bi bi-speedometer2 me-1"></i>Dashboard
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
                <Dropdown.Item onClick={() => navigate('/dashboard')}>
                  <i className="bi bi-speedometer2 me-2"></i>Dashboard
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

      <Container className="py-3">
        {/* Statistics Cards */}
        <Row className="mb-3 g-3">
          <Col xs={4}>
            <Card className="text-center">
              <Card.Body className="py-1">
                <div className="text-primary mb-0" style={{ fontSize: '1.5rem' }}>
                  <i className="bi bi-calendar-check"></i>
                </div>
                <h5 className="mb-0">{allTimeStats.totalDays}</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Įrašų</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card className="text-center">
              <Card.Body className="py-1">
                <div className="text-success mb-0" style={{ fontSize: '1.5rem' }}>
                  <i className="bi bi-trophy"></i>
                </div>
                <h5 className="mb-0">{allTimeStats.daysGoalReached}</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Pasiekimai</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card className="text-center">
              <Card.Body className="py-1">
                <div className="text-info mb-0" style={{ fontSize: '1.5rem' }}>
                  <i className="bi bi-bar-chart"></i>
                </div>
                <h5 className="mb-0">{allTimeStats.averageProtein} g</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Vidutiniškai</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Monthly Chart */}
        <Card className="mt-3">
          <Card.Body>
            <Row className="mb-3 align-items-center">
              <Col xs={12} md={4}>
                <h6 className="fw-bold mb-2 mb-md-0">Mėnesio grafikas</h6>
              </Col>
              <Col xs={6} md={4}>
                <Form.Select
                  size="sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={4}>
                <Form.Select
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleDateString('lt-LT', { month: 'long' })}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <div style={{ height: '200px' }}>
              <Line data={{
                labels: chartData.map(d => d.day),
                datasets: [
                  {
                    label: 'Baltymai (g)',
                    data: chartData.map(d => d.protein),
                    borderColor: 'rgb(13, 110, 253)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Tikslas',
                    data: chartData.map(() => goal),
                    borderColor: 'rgba(220, 53, 69, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                  }
                ]
              }} options={{
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
              }} />
            </div>
          </Card.Body>
        </Card>

        {/* Weight Tracking Chart */}
        <Card className="mt-3">
          <Card.Body>
            <Row className="mb-3 align-items-center">
              <Col xs={12} md={3}>
                <h6 className="fw-bold mb-2 mb-md-0">Svorio sekimas</h6>
              </Col>
              <Col xs={12} md={9}>
                <Row className="g-2">
                  <Col xs={6} sm={6} md={5}>
                    <InputGroup size="sm">
                      <Form.Control
                        type="number"
                        placeholder={lastEnteredWeight ? `${lastEnteredWeight}kg` : "Svoris (kg)"}
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        step="0.1"
                        min="30"
                        max="300"
                        style={{ fontSize: '0.875rem' }}
                      />
                      <Button 
                        variant="primary" 
                        onClick={handleAddWeight}
                        disabled={weightLoading}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                      >
                        Svoris
                      </Button>
                    </InputGroup>
                  </Col>
                  <Col xs={6} sm={6} md={5}>
                    <InputGroup size="sm">
                      <Form.Control
                        type="number"
                        placeholder={weightGoal > 0 ? `${weightGoal}kg` : "Tikslas (kg)"}
                        value={newWeightGoal}
                        onChange={(e) => setNewWeightGoal(e.target.value)}
                        step="0.1"
                        min="30"
                        max="300"
                        style={{ fontSize: '0.875rem' }}
                      />
                      <Button 
                        variant="primary" 
                        onClick={handleSetWeightGoal}
                        disabled={weightLoading}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                      >
                        Tikslas
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Col>
            </Row>
            <div style={{ height: '200px' }}>
              <Line data={{
                labels: weightChartData.map(d => d.day),
                datasets: [
                  {
                    label: 'Svoris (kg)',
                    data: weightChartData.map(d => d.weight === null ? undefined : d.weight),
                    borderColor: 'rgb(25, 135, 84)',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    spanGaps: true,
                  },
                  {
                    label: 'Tikslas',
                    data: weightChartData.map(() => weightGoal > 0 ? weightGoal : undefined),
                    borderColor: 'rgba(220, 53, 69, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                  }
                ]
              }} options={{
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
                    beginAtZero: false,
                    min: latestWeight ? Math.round(latestWeight) - 3 : undefined,
                    max: latestWeight ? Math.round(latestWeight) + 3 : undefined,
                    ticks: {
                      stepSize: 1,
                      callback: function(value) {
                        return Math.round(value) + 'kg';
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
                  intersect: false,
                  filter: function(interactionItem) {
                    // Only allow interaction with weight dataset (index 0), not goal line (index 1)
                    return interactionItem.datasetIndex === 0;
                  }
                },
                onClick: handleWeightChartClick
              }} />
            </div>
          </Card.Body>
        </Card>

        {/* Weight Edit/Delete Modal */}
        <Modal show={showWeightModal} onHide={() => setShowWeightModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedWeightEntry && new Date(selectedWeightEntry.date + 'T12:00:00').toLocaleDateString('lt-LT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Svoris (kg)</Form.Label>
              <Form.Control
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                step="0.1"
                min="30"
                max="300"
                placeholder="Įveskite svorį"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="danger" 
              onClick={handleDeleteWeight}
              disabled={weightLoading}
            >
              <i className="bi bi-trash me-2"></i>Ištrinti
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditWeight}
              disabled={weightLoading || !editWeight}
            >
              {weightLoading ? 'Išsaugoma...' : 'Išsaugoti'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Detailed List */}
        <Card className="mt-3">
          <Card.Body>
            <h6 className="fw-bold mb-3">
              Detalus sąrašas
              <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.875rem' }}>
                ({new Date(selectedYear, selectedMonth - 1).toLocaleDateString('lt-LT', { year: 'numeric', month: 'long' })})
              </span>
            </h6>
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: '0.75rem', padding: '0.5rem', width: '20%' }}>Data</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.5rem', width: '20%' }}>Baltymai</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.5rem', width: '20%' }}>Tikslas</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.5rem', width: '40%' }}>Progresas</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData
                    .filter(d => d.protein > 0)
                    .reverse()
                    .map((day) => {
                      const percentage = Math.min(Math.round((day.protein / goal) * 100), 100);
                      const variant = 
                        percentage >= 100 ? 'success' :
                        percentage >= 75 ? 'info' :
                        percentage >= 50 ? 'warning' : 'danger';
                      
                      return (
                        <tr 
                          key={day.day} 
                          onClick={() => loadDayEntries(day.day)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ padding: '0.5rem' }}>{day.day}</td>
                          <td style={{ padding: '0.5rem' }} className="fw-bold">{day.protein} g</td>
                          <td style={{ padding: '0.5rem' }}>{goal} g</td>
                          <td style={{ padding: '0.5rem' }}>
                            <ProgressBar 
                              now={percentage} 
                              label={`${percentage}%`}
                              variant={variant}
                              style={{ height: '24px' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              {chartData.filter(d => d.protein > 0).length === 0 && (
                <div className="text-center text-muted py-3">
                  Nėra duomenų pasirinktam mėnesiui
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Modal with day details */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('lt-LT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Modal.Title>
            {modalEntries.length > 0 && (
              <i 
                className="bi bi-trash text-danger ms-auto me-2" 
                onClick={handleDeleteDayEntries}
                style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                title="Ištrinti visus įrašus"
              ></i>
            )}
          </Modal.Header>
          <Modal.Body>
            {modalEntries.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-inbox display-1"></i>
                <p className="mt-2">Nėra produktų šiai dienai</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="table-sm mb-0" style={{ fontSize: '0.875rem', tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '14%' }}>Laikas</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '42%' }}>Produktas</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '22%' }}>Porcija</th>
                      <th style={{ fontSize: '0.75rem', padding: '0.5rem 0.375rem', width: '22%' }}>Baltymai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalEntries.map((entry) => {
                      const time = entry.timestamp 
                        ? new Date(entry.timestamp).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{time}</td>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{entry.food_name}</td>
                          <td style={{ padding: '0.3rem 0.375rem' }}>{entry.serving_size}</td>
                          <td className="fw-bold" style={{ padding: '0.3rem 0.375rem' }}>{Math.round(entry.protein_amount)} g</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Modal.Body>
        </Modal>
      </Container>

      <style>{`
        .navbar .nav-link {
          color: #000 !important;
          font-weight: bold;
        }
        
        .navbar .nav-link:hover {
          color: #333 !important;
        }
      `}</style>
    </div>
  );
};

export default History;
