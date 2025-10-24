import React, { useRef, useEffect, useState } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  Target, 
  BarChart3, 
  Settings, 
  ListChecks, 
  Users, 
  Heart, 
  DollarSign, 
  BookOpen, 
  FolderOpen, 
  Smartphone, 
  Palette, 
  Lightbulb, 
  Shield, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Star,
  Award,
  TrendingUp,
  Clock,
  Globe,
  Mail,
  Phone,
  Calendar,
  Zap,
  Brain,
  Compass,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Key,
  Activity,
  Target as TargetIcon,
  Flag,
  MapPin,
  Languages,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  Home,
  Car,
  Plane,
  Gamepad2,
  Music,
  Camera,
  Coffee,
  Dumbbell,
  Moon,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Flame,
  Snowflake,
  TreePine,
  Mountain,
  Waves,
  Leaf,
  Flower,
  Bug,
  Fish,
  Bird,
  Dog,
  Cat,
  Rabbit,
  Mouse,
  Squirrel,
  Whale,
  Butterfly,
  Bee,
  Spider,
  Ant,
  Ladybug,
  Dragonfly,
  Firefly,
  Snail,
  Turtle,
  Frog,
  Lizard,
  Snake,
  Crocodile,
  Penguin,
  Owl,
  Eagle,
  Parrot,
  Toucan,
  Flamingo,
  Peacock,
  Swan,
  Duck,
  Chicken,
  Rooster,
  Turkey,
  Goose,
  Pigeon,
  Crow,
  Raven,
  Magpie,
  Robin,
  Bluebird,
  Cardinal,
  Hummingbird,
  Woodpecker,
  Hawk,
  Falcon,
  Vulture,
  Condor,
  Albatross,
  Seagull,
  Pelican,
  Stork,
  Heron,
  Crane,
  Ibis,
  Spoonbill,
  Spoon,
  Fork,
  Knife,
  Plate,
  Cup,
  Mug,
  Glass,
  Bottle,
  Wine,
  Beer,
  Cocktail,
  Juice,
  Water,
  Milk,
  Tea,
  Coffee as CoffeeIcon,
  Ice,
  Sugar,
  Salt,
  Pepper,
  Spice,
  Herb,
  Garlic,
  Onion,
  Tomato,
  Carrot,
  Potato,
  Broccoli,
  Cauliflower,
  Cabbage,
  Lettuce,
  Spinach,
  Kale,
  Arugula,
  Basil,
  Mint,
  Parsley,
  Cilantro,
  Rosemary,
  Thyme,
  Oregano,
  Sage,
  Bay,
  Cinnamon,
  Nutmeg,
  Ginger,
  Turmeric,
  Paprika,
  Chili,
  Jalapeno,
  Bell,
  Eggplant,
  Zucchini,
  Squash,
  Pumpkin,
  Corn,
  Peas,
  Beans,
  Lentils,
  Chickpeas,
  Quinoa,
  Rice,
  Wheat,
  Oats,
  Barley,
  Rye,
  Buckwheat,
  Millet,
  Sorghum,
  Amaranth,
  Teff,
  Spelt,
  Kamut,
  Farro,
  Bulgur,
  Couscous,
  Pasta,
  Noodles,
  Bread,
  Croissant,
  Bagel,
  Muffin,
  Pancake,
  Waffle,
  Toast,
  Sandwich,
  Burger,
  Pizza,
  Pasta as PastaIcon,
  Salad,
  Soup,
  Stew,
  Curry,
  Stir,
  Grill,
  Roast,
  Bake,
  Fry,
  Boil,
  Steam,
  Saute,
  Braise,
  Poach,
  Blanch,
  Marinate,
  Season,
  Spice as SpiceIcon,
  Flavor,
  Taste,
  Smell,
  Aroma,
  Scent,
  Fragrance,
  Perfume,
  Cologne,
  Soap,
  Shampoo,
  Conditioner,
  Lotion,
  Cream,
  Oil,
  Butter,
  Margarine,
  Cheese,
  Milk as MilkIcon,
  Yogurt,
  Ice,
  Cream as CreamIcon,
  Sorbet,
  Gelato,
  Pudding,
  Custard,
  Mousse,
  Souffle,
  Cake,
  Pie,
  Tart,
  Cookie,
  Biscuit,
  Cracker,
  Pretzel,
  Chips,
  Popcorn,
  Nuts,
  Seeds,
  Dried,
  Fresh,
  Frozen,
  Canned,
  Jarred,
  Pickled,
  Fermented,
  Aged,
  Smoked,
  Cured,
  Dried as DriedIcon,
  Fresh as FreshIcon,
  Organic,
  Natural,
  Healthy,
  Nutritious,
  Vitamin,
  Mineral,
  Protein,
  Carbohydrate,
  Fat,
  Fiber,
  Sugar as SugarIcon,
  Salt as SaltIcon,
  Sodium,
  Potassium,
  Calcium,
  Iron,
  Zinc,
  Magnesium,
  Phosphorus,
  Selenium,
  Copper,
  Manganese,
  Iodine,
  Fluoride,
  Chromium,
  Molybdenum,
  Cobalt,
  Nickel,
  Vanadium,
  Silicon,
  Boron,
  Arsenic,
  Lead,
  Mercury,
  Cadmium,
  Aluminum,
  Tin,
  Silver,
  Gold,
  Platinum,
  Palladium,
  Rhodium,
  Iridium,
  Osmium,
  Ruthenium,
  Rhenium,
  Tungsten,
  Tantalum,
  Hafnium,
  Zirconium,
  Titanium,
  Vanadium as VanadiumIcon,
  Niobium,
  Molybdenum as MolybdenumIcon,
  Technetium,
  Ruthenium as RutheniumIcon,
  Rhodium as RhodiumIcon,
  Palladium as PalladiumIcon,
  Silver as SilverIcon,
  Cadmium as CadmiumIcon,
  Indium,
  Tin as TinIcon,
  Antimony,
  Tellurium,
  Iodine as IodineIcon,
  Xenon,
  Cesium,
  Barium,
  Lanthanum,
  Cerium,
  Praseodymium,
  Neodymium,
  Promethium,
  Samarium,
  Europium,
  Gadolinium,
  Terbium,
  Dysprosium,
  Holmium,
  Erbium,
  Thulium,
  Ytterbium,
  Lutetium,
  Hafnium as HafniumIcon,
  Tantalum as TantalumIcon,
  Tungsten as TungstenIcon,
  Rhenium as RheniumIcon,
  Osmium as OsmiumIcon,
  Iridium as IridiumIcon,
  Platinum as PlatinumIcon,
  Gold as GoldIcon,
  Mercury as MercuryIcon,
  Thallium,
  Lead as LeadIcon,
  Bismuth,
  Polonium,
  Astatine,
  Radon,
  Francium,
  Radium,
  Actinium,
  Thorium,
  Protactinium,
  Uranium,
  Neptunium,
  Plutonium,
  Americium,
  Curium,
  Berkelium,
  Californium,
  Einsteinium,
  Fermium,
  Mendelevium,
  Nobelium,
  Lawrencium,
  Rutherfordium,
  Dubnium,
  Seaborgium,
  Bohrium,
  Hassium,
  Meitnerium,
  Darmstadtium,
  Roentgenium,
  Copernicium,
  Nihonium,
  Flerovium,
  Moscovium,
  Livermorium,
  Tennessine,
  Oganesson
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Switch } from '@/components/atoms/Switch';
import { Progress } from '@/components/atoms/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { cn } from '@/utils/utils';

interface PersonalDataCardProps {
  user: any;
  onClose: () => void;
}

interface SectionData {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  expanded: boolean;
  data: any;
}

export const PersonalDataCard: React.FC<PersonalDataCardProps> = ({
  user,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionData[]>([
    {
      id: 'personal',
      title: 'Personal Information',
      icon: User,
      expanded: true,
      data: {
        name: user?.display_name || '',
        age: '',
        location: '',
        timezone: '',
        bio: '',
        languages: [],
        education: '',
        university: '',
        graduationYear: '',
      }
    },
    {
      id: 'work',
      title: 'Work Details',
      icon: Briefcase,
      expanded: false,
      data: {
        jobTitle: '',
        company: '',
        industry: '',
        experienceLevel: '',
        skills: [],
        certifications: [],
        workHours: '',
        workStyle: '',
        communicationStyle: '',
        collaborationPreferences: '',
      }
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      icon: Target,
      expanded: false,
      data: {
        careerGoals: [],
        personalGoals: [],
        learningGoals: [],
        financialGoals: [],
        lifeGoals: [],
        shortTermGoals: [],
        longTermGoals: [],
        priorityGoals: [],
      }
    },
    {
      id: 'performance',
      title: 'Performance & Analytics',
      icon: BarChart3,
      expanded: false,
      data: {
        productivityMetrics: {},
        timeManagement: {},
        learningProgress: {},
        wellnessMetrics: {},
        achievementTracking: {},
        efficiencyMetrics: {},
        focusAreas: [],
        improvementAreas: [],
      }
    },
    {
      id: 'preferences',
      title: 'Preferences & Settings',
      icon: Settings,
      expanded: false,
      data: {
        workPreferences: {},
        learningPreferences: {},
        wellnessPreferences: {},
        technologyPreferences: {},
        communicationPreferences: {},
        environmentPreferences: {},
        schedulePreferences: {},
        interactionPreferences: {},
      }
    },
    {
      id: 'habits',
      title: 'Habits & Routines',
      icon: ListChecks,
      expanded: false,
      data: {
        dailyRoutines: {},
        weeklyRoutines: {},
        monthlyRoutines: {},
        seasonalRoutines: {},
        habitTracking: {},
        habitGoals: {},
        habitStreaks: {},
        habitChallenges: {},
      }
    },
    {
      id: 'relationships',
      title: 'Relationships & Network',
      icon: Users,
      expanded: false,
      data: {
        professionalNetwork: [],
        personalNetwork: [],
        mentorship: {},
        collaboration: {},
        community: [],
        socialConnections: [],
        professionalAssociations: [],
        onlineCommunities: [],
      }
    },
    {
      id: 'wellness',
      title: 'Health & Wellness',
      icon: Heart,
      expanded: false,
      data: {
        physicalHealth: {},
        mentalHealth: {},
        sleep: {},
        nutrition: {},
        recovery: {},
        exercise: {},
        stressManagement: {},
        wellnessGoals: {},
      }
    },
    {
      id: 'financial',
      title: 'Financial Information',
      icon: DollarSign,
      expanded: false,
      data: {
        income: {},
        expenses: {},
        investments: {},
        debt: {},
        financialGoals: {},
        budget: {},
        savings: {},
        retirement: {},
      }
    },
    {
      id: 'learning',
      title: 'Learning & Development',
      icon: BookOpen,
      expanded: false,
      data: {
        currentLearning: [],
        completedLearning: [],
        learningGoals: [],
        learningResources: [],
        learningPreferences: {},
        skills: [],
        certifications: [],
        courses: [],
      }
    },
    {
      id: 'projects',
      title: 'Projects & Work',
      icon: FolderOpen,
      expanded: false,
      data: {
        currentProjects: [],
        completedProjects: [],
        projectGoals: {},
        workEnvironment: {},
        workLifeBalance: {},
        projectManagement: {},
        teamCollaboration: {},
        projectOutcomes: {},
      }
    },
    {
      id: 'technology',
      title: 'Technology & Tools',
      icon: Smartphone,
      expanded: false,
      data: {
        preferredTools: [],
        technologyStack: [],
        digitalHabits: {},
        automation: {},
        security: {},
        devices: [],
        software: [],
        hardware: [],
      }
    },
    {
      id: 'interests',
      title: 'Personal Interests',
      icon: Palette,
      expanded: false,
      data: {
        hobbies: [],
        entertainment: {},
        travel: {},
        sports: [],
        creative: [],
        recreational: [],
        cultural: [],
        intellectual: [],
      }
    },
    {
      id: 'values',
      title: 'Values & Philosophy',
      icon: Lightbulb,
      expanded: false,
      data: {
        coreValues: [],
        workValues: [],
        learningValues: [],
        relationshipValues: [],
        lifeValues: [],
        ethicalPrinciples: [],
        lifePhilosophy: '',
        personalMission: '',
      }
    }
  ]);

  // Handle ESC key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const startEditing = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const stopEditing = () => {
    setEditingSection(null);
  };

  const saveSection = (sectionId: string) => {
    // TODO: Implement save functionality
    console.log('Saving section:', sectionId);
    setEditingSection(null);
  };

  const renderSectionContent = (section: SectionData) => {
    if (!section.expanded) return null;

    const isEditing = editingSection === section.id;

    return (
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            {/* Render editable fields based on section type */}
            {section.id === 'personal' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name"
                  value={section.data.name}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, name: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Age"
                  value={section.data.age}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, age: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Location"
                  value={section.data.location}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, location: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Timezone"
                  value={section.data.timezone}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, timezone: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}
            
            {section.id === 'work' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Job Title"
                  value={section.data.jobTitle}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, jobTitle: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Company"
                  value={section.data.company}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, company: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Industry"
                  value={section.data.industry}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, industry: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  label="Experience Level"
                  value={section.data.experienceLevel}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, data: { ...s.data, experienceLevel: e.target.value } }
                        : s
                    ));
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            {/* Add more section-specific editing interfaces as needed */}
            
            <div className="flex gap-2">
              <Button onClick={() => saveSection(section.id)} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={stopEditing} className="border-white/20 text-white/80">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render read-only view */}
            {Object.entries(section.data).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-white/60">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value) || 'Not set'}
                  </p>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={() => startEditing(section.id)}
              className="border-white/20 text-white/80"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-6xl max-h-[90vh] bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border border-white/15 bg-white/5">
              <AvatarFallback className="text-lg text-white/80">
                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-white">Personal Data Card</h2>
              <p className="text-sm text-white/60">
                Comprehensive personal information for AI analysis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id} className="bg-slate-800/60 border-white/10">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <section.icon className="h-5 w-5 text-white/80" />
                      <CardTitle className="text-white">{section.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.expanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(section.id);
                          }}
                          className="text-white/60 hover:text-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      {section.expanded ? (
                        <ChevronDown className="h-4 w-4 text-white/60" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-white/60" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderSectionContent(section)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="text-sm text-white/60">
            This data helps ATMO provide personalized insights and recommendations.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/20 text-white/80">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
