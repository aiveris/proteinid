import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Nav, Alert, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || '');
        setWeight(data.weight || '');
        setGender(data.gender || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        weight: parseFloat(weight),
        gender
      });
      
      setMessage('Profilis atnaujintas!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Klaida atnaujinant profilį');
    } finally {
      setLoading(false);
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

  const calculateGoal = () => {
    if (weight && gender) {
      const multiplier = gender === 'male' ? 1.8 : 1.6;
      return Math.round(parseFloat(weight) * multiplier);
    }
    return 0;
  };

  return (
    <div className="profile-page">
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
              <Nav.Link onClick={() => navigate('/history')}>
                <i className="bi bi-clock-history me-1"></i>Istorija
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
                <Dropdown.Item onClick={() => navigate('/history')}>
                  <i className="bi bi-clock-history me-2"></i>Istorija
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
        <Card>
          <Card.Body className="p-2">
            <h6 className="fw-bold mb-2">
              <i className="bi bi-person-gear me-2"></i>
              Profilio Nustatymai
            </h6>

            {message && (
              <Alert variant={message.includes('Klaida') ? 'danger' : 'success'}>
                {message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">El. paštas</Form.Label>
                <Form.Control
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Vardas</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jūsų vardas"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Svoris (kg)</Form.Label>
                <Form.Control
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  required
                  min="30"
                  max="300"
                  step="0.1"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Lytis</Form.Label>
                <Form.Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Pasirinkite...</option>
                  <option value="male">Vyras</option>
                  <option value="female">Moteris</option>
                </Form.Select>
              </Form.Group>

              {weight && gender && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Jūsų dienos tikslas: <strong>{calculateGoal()}g</strong> baltymų
                  <br />
                  <small className="text-muted">
                    (Vyrams: {weight} kg × 1.8 | Moterims: {weight} kg × 1.6)
                  </small>
                </Alert>
              )}

              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="w-100"
              >
                {loading ? 'Išsaugoma...' : 'Išsaugoti'}
              </Button>
            </Form>
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
      `}</style>
    </div>
  );
};

export default Profile;
