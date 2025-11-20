import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
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

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-electric/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">A plataforma #1 para atletas</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Registre. Evolua.{" "}
              <span className="bg-gradient-to-r from-primary via-electric to-primary bg-clip-text text-transparent animate-gradient">
                Supere-se.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A plataforma completa para acompanhar seus treinos, registrar sua evolução
              e alcançar seus objetivos fitness junto com uma comunidade de atletas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow w-full sm:w-auto text-lg px-8 py-6">
                  Começar Gratuitamente
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 mt-12 border-t border-border/50">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-electric bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
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
                className="p-6 gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 group"
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
