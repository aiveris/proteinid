import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
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

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetError('Įveskite el. pašto adresą');
      return;
    }

    try {
      setResetError('');
      setResetMessage('');
      setLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Slaptažodžio atkūrimo nuoroda išsiųsta į jūsų el. paštą');
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setResetError('Vartotojas su tokiu el. paštu nerastas');
      } else if (error.code === 'auth/invalid-email') {
        setResetError('Neteisingas el. pašto formatas');
      } else {
        setResetError('Nepavyko išsiųsti slaptažodžio atkūrimo nuorodos');
      }
      console.error('Password reset error:', error);
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
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
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

                  <div className="text-end mb-3">
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none"
                      onClick={() => setShowResetModal(true)}
                    >
                      Pamiršote slaptažodį?
                    </Button>
                  </div>

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

      {/* Password Reset Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Slaptažodžio atkūrimas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetMessage && <Alert variant="success">{resetMessage}</Alert>}
          {resetError && <Alert variant="danger">{resetError}</Alert>}
          
          <Form.Group>
            <Form.Label className="fw-bold">El. paštas</Form.Label>
            <Form.Control
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="vardas@example.com"
            />
            <Form.Text className="text-muted">
              Įveskite savo el. pašto adresą ir mes atsiųsime slaptažodžio atkūrimo nuorodą.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Atšaukti
          </Button>
          <Button variant="primary" onClick={handlePasswordReset} disabled={loading}>
            {loading ? 'Siunčiama...' : 'Siųsti nuorodą'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
    </div>
  );
};

export default Login;
