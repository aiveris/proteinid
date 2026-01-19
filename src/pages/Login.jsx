import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
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
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      const result = await signIn(email, password);
      await checkUserProfileAndNavigate(result.user);
    } catch (error) {
      setError('Nepavyko prisijungti. Patikrinkite el. paštą ir slaptažodį.');
      console.error('Login error:', error);
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
      setError('Nepavyko prisijungti su Google.');
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
              <h4 className="card-title mb-4 text-center fw-bold">Prisijungti</h4>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
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
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    {loading ? 'Jungiamasi...' : 'Prisijungti'}
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
                  Neturite paskyros? <Link to="/register">Registruotis</Link>
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

export default Login;
