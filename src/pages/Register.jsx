import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const checkUserProfileAndNavigate = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Check if user has weight and gender data
        if (userData.weight && userData.gender) {
          navigate('/dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        // If no user document, redirect to profile to complete setup
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      navigate('/profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Slaptažodžiai nesutampa');
    }
    
    if (password.length < 6) {
      return setError('Slaptažodis turi būti bent 6 simbolių');
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await signUp(email, password, name);
      await checkUserProfileAndNavigate(result.user);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Šis el. paštas jau užregistruotas');
      } else if (error.code === 'auth/weak-password') {
        setError('Slaptažodis per silpnas');
      } else {
        setError('Nepavyko sukurti paskyros');
      }
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await signInWithGoogle();
      await checkUserProfileAndNavigate(result.user);
    } catch (error) {
      setError('Nepavyko prisijungti su Google');
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h4 className="card-title mb-4 text-center fw-bold">Registruotis</h4>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Vardas</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jūsų vardas"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">El. paštas</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vardas@example.com"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Slaptažodis</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ textDecoration: 'none', color: '#6c757d' }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Patvirtinti slaptažodį</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ textDecoration: 'none', color: '#6c757d' }}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Kuriama paskyra...' : 'Registruotis'}
                  </Button>
                </Form>

                <div className="text-center my-4">
                  <span className="text-muted">arba</span>
                </div>

                <Button 
                  variant="outline-danger" 
                  className="w-100 mb-3"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <i className="fab fa-google me-2"></i>
                  Prisijungti su Google
                </Button>

              <div className="text-center mt-4">
                <p className="mb-0">
                  Jau turite paskyrą? <Link to="/login">Prisijungti</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default Register;
