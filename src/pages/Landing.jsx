import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { MeshGradient } from '@paper-design/shaders-react';

const Landing = () => {
  const features = [
    {
      icon: 'fa-search',
      title: 'Greita paieška',
      description: 'Raskite produktus akimirksniu su integruota USDA duomenų baze. Tūkstančiai produktų lietuvių kalba.'
    },
    {
      icon: 'fa-chart-bar',
      title: 'Statistika',
      description: 'Sekite savo pažangą su vizualiais grafikais. Matykite kiek baltymų suvartojate kasdien.'
    },
    {
      icon: 'fa-bullseye',
      title: 'Asmeniniai tikslai',
      description: 'Automatiškai apskaičiuojamas dienos tikslas pagal jūsų svorį ir lytį. Lengvai stebėkite progresą.'
    },
    {
      icon: 'fa-history',
      title: 'Istorija',
      description: 'Peržiūrėkite savo ankstesnių dienų duomenis. Analizuokite tendencijas ir optimizuokite mitybą.'
    },
    {
      icon: 'fa-mobile-alt',
      title: 'Mobiliai patogus',
      description: 'Veikia bet kuriame įrenginyje - telefone, planšetėje ar kompiuteryje. Naudokite bet kur ir bet kada.'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Saugus',
      description: 'Jūsų duomenys saugiai saugomi Google duomenų bazėje.'
    }
  ];

  const howItWorks = [
    {
      icon: 'fa-sign-in-alt',
      title: '1. Prisijunkite',
      description: 'Naudokite savo paskyrą prisijungimui'
    },
    {
      icon: 'fa-cog',
      title: '2. Nustatykite profilį',
      description: 'Įveskite savo ūgį, svorį ir lytį'
    },
    {
      icon: 'fa-utensils',
      title: '3. Pridėkite maistą',
      description: 'Įrašykite, ką valgote, ir stebėkite progresą'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section with Shader Background */}
      <section className="hero-section">
        {/* Mesh Gradient Shader Background */}
        <MeshGradient
          className="hero-shader-bg"
          colors={['#667eea', '#764ba2', '#f093fb', '#5e72e4']}
          speed={0.3}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />
        
        {/* Animated light overlay effects */}
        <div className="lighting-overlay">
          <div className="light-orb light-orb-1"></div>
          <div className="light-orb light-orb-2"></div>
          <div className="light-orb light-orb-3"></div>
        </div>

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <Row className="align-items-center">
            <Col lg={12} className="text-center mb-5 mb-lg-0">
              <h1 className="hero-title">
                <i className="fas fa-dumbbell me-3"></i>ProteinID
              </h1>
              <p className="hero-subtitle">
                Sekite savo kasdienį baltymų suvartojimo kiekį lengvai ir efektyviai. 
                Pasiekite savo sporto tikslus su profesionaliu baltymų sekimu.
              </p>
              
              {/* Stats Badges */}
              <div className="mb-4">
                <span className="stats-badge">
                  <i className="fas fa-check-circle me-2"></i>100% Nemokama
                </span>
                <span className="stats-badge">
                  <i className="fas fa-mobile-alt me-2"></i>Veikia visur
                </span>
                <span className="stats-badge">
                  <i className="fas fa-chart-line me-2"></i>Detalūs grafikai
                </span>
              </div>
              
              {/* CTA Buttons */}
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Link to="/login" className="btn btn-light btn-lg cta-button">
                  <i className="fas fa-sign-in-alt me-2"></i>Prisijungti
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <div className="text-center mb-4">
            <h2 className="section-title">Kodėl ProteinID?</h2>
            <p className="section-subtitle">Visos funkcijos, kurių reikia baltymų sekimui</p>
          </div>
          
          <Row className="g-3">
            {features.map((feature, index) => (
              <Col key={index} md={4}>
                <Card className="feature-card">
                  <div className="feature-icon">
                    <i className={`fas ${feature.icon}`}></i>
                  </div>
                  <h4 className="text-center mb-2">{feature.title}</h4>
                  <p className="text-center text-muted">
                    {feature.description}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-3 bg-white">
        <Container>
          <div className="text-center mb-3">
            <h2 className="section-title">Kaip tai veikia?</h2>
            <p className="section-subtitle">Pradėkite sekti baltymus per 3 paprastus žingsnius</p>
          </div>
          
          <Row className="g-3">
            {howItWorks.map((step, index) => (
              <Col key={index} md={4} className="text-center">
                <div className="mb-2">
                  <div className="feature-icon mx-auto">
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                </div>
                <h4>{step.title}</h4>
                <p className="text-muted mb-0">{step.description}</p>
              </Col>
            ))}
          </Row>
          
          <div className="text-center mt-3">
            <Link to="/login" className="btn btn-primary btn-lg cta-button" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}>
              <i className="fas fa-rocket me-2"></i>Pradėti dabar
            </Link>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-3">
        <Container>
          <Row>
            <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
              <h5><i className="fas fa-dumbbell me-2"></i>ProteinID</h5>
              <p className="mb-0 text-muted">Jūsų asmeninis baltymų sekimo asistentas</p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <p className="mb-0 text-muted">
                &copy; 2026 ProteinID. Visos teisės saugomos.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;
