import { FileText, Scale, Users, BookOpen, Settings, FileCheck, Briefcase, Library, FileBarChart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BancoDados = () => {
  const documentCategories = [
    {
      title: "Contratos Sociais",
      description: "Contratos de constituição, alteração e dissolução de empresas com modelos atualizados",
      icon: Briefcase,
      color: "from-blue-500/10 to-blue-600/5",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
      borderColor: "border-blue-500/20 hover:border-blue-500/40",
      count: 247
    },
    {
      title: "Procurações",
      description: "Procurações ad judicia, específicas e gerais para representação legal completa",
      icon: Users,
      color: "from-green-500/10 to-green-600/5",
      iconBg: "bg-green-500/10", 
      iconColor: "text-green-600",
      borderColor: "border-green-500/20 hover:border-green-500/40",
      count: 156
    },
    {
      title: "Banco de Jurisprudências",
      description: "Decisões, acórdãos e jurisprudências organizadas por área do direito e tribunal",
      icon: Scale,
      color: "from-purple-500/10 to-purple-600/5",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600", 
      borderColor: "border-purple-500/20 hover:border-purple-500/40",
      count: 892
    },
    {
      title: "Manuais e POP's",
      description: "Procedimentos operacionais padrão e manuais internos do escritório atualizados",
      icon: BookOpen,
      color: "from-orange-500/10 to-orange-600/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
      borderColor: "border-orange-500/20 hover:border-orange-500/40", 
      count: 34
    },
    {
      title: "Modelos de Petições",
      description: "Templates de petições iniciais, recursos e manifestações processuais validados",
      icon: FileText,
      color: "from-indigo-500/10 to-indigo-600/5", 
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
      count: 198
    },
    {
      title: "Legislação",
      description: "Leis, decretos, portarias e normativas organizadas por matéria e atualização",
      icon: Library,
      color: "from-red-500/10 to-red-600/5",
      iconBg: "bg-red-500/10", 
      iconColor: "text-red-600",
      borderColor: "border-red-500/20 hover:border-red-500/40",
      count: 567
    },
    {
      title: "Documentos Administrativos", 
      description: "Formulários, certidões e documentos para procedimentos administrativos diversos",
      icon: FileCheck,
      color: "from-teal-500/10 to-teal-600/5",
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-600", 
      borderColor: "border-teal-500/20 hover:border-teal-500/40",
      count: 123
    },
    {
      title: "Pareceres Técnicos",
      description: "Pareceres jurídicos, estudos e análises técnicas especializadas por área",
      icon: FileBarChart,
      color: "from-yellow-500/10 to-yellow-600/5",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-500/20 hover:border-yellow-500/40", 
      count: 89
    }
  ];

  const handleCategoryClick = (categoryTitle: string) => {
    // Implementação futura para OneDrive
    console.log(`Acessando categoria: ${categoryTitle}`);
    // window.open('https://onedrive.com/pasta-especifica', '_blank');
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full">
          <Library className="w-4 h-4 mr-2 text-primary" />
          <span className="text-sm font-medium text-primary">Banco de Dados Premium</span>
        </div>
        
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
          Banco de Dados do Escritório
        </h1>
        
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
          Acesse mais de <span className="font-semibold text-primary">2.300 documentos</span> organizados 
          por categoria. Todos os arquivos estão sincronizados com o OneDrive do escritório.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de Documentos", value: documentCategories.reduce((acc, cat) => acc + cat.count, 0).toLocaleString() },
          { label: "Categorias Ativas", value: documentCategories.length.toString() },
          { label: "Atualizações Mensais", value: "47" },
          { label: "Downloads Este Mês", value: "1,234" }
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="bg-gradient-card p-4 rounded-xl border border-border/50 hover-lift text-center"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documentCategories.map((category, index) => (
          <Card 
            key={category.title}
            className={cn(
              "group cursor-pointer transition-all duration-300 hover-lift relative overflow-hidden",
              `bg-gradient-to-br ${category.color}`,
              category.borderColor,
              "hover:shadow-elevated"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleCategoryClick(category.title)}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                  category.iconBg
                )}>
                  <category.icon className={cn("w-6 h-6", category.iconColor)} />
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{category.count}</div>
                  <div className="text-xs text-muted-foreground">arquivos</div>
                </div>
              </div>
              
              <CardTitle className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                {category.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative pt-0">
              <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-6">
                {category.description}
              </CardDescription>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryClick(category.title);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Acessar OneDrive
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-card p-6 rounded-xl border border-border/50 text-center">
        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
          Precisa de ajuda?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Para acessar os documentos, certifique-se de estar logado no OneDrive do escritório com suas credenciais corporativas.
        </p>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Central de Ajuda
        </Button>
      </div>
    </div>
  );
};

export default BancoDados;