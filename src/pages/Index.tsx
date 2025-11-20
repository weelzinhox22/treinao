import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  TrendingUp, 
  BarChart3, 
  Camera, 
  Calendar, 
  Trophy, 
  Target,
  Users,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: "Registre Seus Treinos",
      description: "Anote exercícios, séries, repetições e cargas de forma simples e rápida.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      title: "Acompanhe Evolução",
      description: "Veja gráficos de progressão e identifique seus recordes pessoais.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: BarChart3,
      title: "Análise de Dados",
      description: "Volume total, frequência e estatísticas detalhadas dos seus treinos.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Camera,
      title: "Fotos de Progresso",
      description: "Registre sua transformação física ao longo do tempo.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Trophy,
      title: "Sistema de Conquistas",
      description: "Desbloqueie badges e conquistas conforme você evolui.",
      color: "from-yellow-500 to-amber-500",
    },
    {
      icon: Users,
      title: "Feed Social",
      description: "Compartilhe seus treinos e inspire outros atletas.",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const stats = [
    { value: "10k+", label: "Atletas Ativos" },
    { value: "50k+", label: "Treinos Registrados" },
    { value: "1k+", label: "Conquistas Desbloqueadas" },
  ];

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parallax suave no scroll para elementos do hero
    if (heroRef.current) {
      const heroTitle = heroRef.current.querySelector('h1');
      const heroDesc = heroRef.current.querySelector('p');
      const heroButtons = heroRef.current.querySelector('[data-hero-buttons]');
      
      if (heroTitle) {
        gsap.to(heroTitle, {
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1
          }
        });
      }

      if (heroDesc) {
        gsap.to(heroDesc, {
          y: -15,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1
          }
        });
      }

      if (heroButtons) {
        gsap.to(heroButtons, {
          y: -10,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1
          }
        });
      }
    }

    // Animação dos cards de features ao entrar na viewport
    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll('[data-parallax-card]');
      
      featureCards.forEach((card) => {
        const cardElement = card as HTMLElement;
        
        // CRÍTICO: Garantir que começa visível IMEDIATAMENTE
        cardElement.style.opacity = '1';
        cardElement.style.transform = 'translateY(0px)';
        
        // Verificar se o card já está visível na viewport
        const rect = cardElement.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) {
          // Só anima se não estiver visível ainda
          gsap.fromTo(card, 
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                toggleActions: "play none none none",
                once: true
              }
            }
          );
        }

        // Parallax suave nos cards (sem afetar opacity)
        gsap.to(card, {
          y: -10,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
          }
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section - Design Moderno e Limpo */}
      <section ref={heroRef} className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background com gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Elementos decorativos sutis */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-electric/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">A plataforma #1 para atletas</span>
              </div>
            </div>
            
            {/* Título Principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6 leading-tight">
              <span className="block text-foreground">Registre. Evolua.</span>
              <span className="block bg-gradient-to-r from-primary via-electric to-primary bg-clip-text text-transparent">
                Supere-se.
              </span>
            </h1>
            
            {/* Descrição */}
            <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-8 leading-relaxed">
              A plataforma completa para acompanhar seus treinos, registrar sua evolução
              e alcançar seus objetivos fitness junto com uma comunidade de atletas.
            </p>
            
            {/* CTAs */}
            <div data-hero-buttons className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg w-full sm:w-auto text-lg px-8 py-6">
                  Começar Gratuitamente
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                  Já tenho conta
                </Button>
              </Link>
              <div className="flex items-center justify-center">
                <InstallPWAButton />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 md:gap-8 pt-8 border-t border-border">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-electric bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para evoluir
            </h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas profissionais para acompanhar seu progresso
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                data-parallax-card
                className="p-6 gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 group"
                style={{ opacity: 1 }}
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que escolher o TREINÃO DOS CARAS?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Rápido e Intuitivo</h3>
                  <p className="text-muted-foreground">
                    Interface simples e direta. Registre seus treinos em segundos.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Seus Dados Seguros</h3>
                  <p className="text-muted-foreground">
                    Tudo sincronizado na nuvem com segurança de nível empresarial.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Metas e Objetivos</h3>
                  <p className="text-muted-foreground">
                    Defina metas e acompanhe seu progresso em tempo real.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Gamificação</h3>
                  <p className="text-muted-foreground">
                    Desbloqueie conquistas e mantenha-se motivado com badges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-electric/20 to-primary/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Pronto para começar sua jornada?
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl">
              Junte-se a milhares de atletas que já transformaram seus treinos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 py-6">
                  Criar Conta Grátis
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left text-muted-foreground">
              <p>© 2025 TREINÃO DOS CARAS. Todos os direitos reservados.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/welziinho"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">@welziinho</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
