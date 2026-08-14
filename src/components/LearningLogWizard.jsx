import React, { useState, useEffect, useRef } from 'react';

// Comprehensive 100+ New Jersey Places of Educational Interest
const NJ_EDUCATIONAL_PLACES = [
  // Hopewell Valley & Mercer County (Local Hubs)
  'Mercer Meadows & Environmental Center (Pennington, NJ)',
  'St. Michaels Farm Preserve (Hopewell, NJ)',
  'Baldpate Mountain & Ted Stiles Preserve (Titusville, NJ)',
  'Watershed Institute Reserve & Discovery Center (Pennington, NJ)',
  'Howell Living History Farm (Lambertville / Hopewell, NJ)',
  'Hopewell Public Library & Community Room (Hopewell, NJ)',
  'Pennington Public Library (Pennington, NJ)',
  'Mercer County Library - Hopewell Valley Branch (Pennington, NJ)',
  'Rosedale Park & Lake (Pennington, NJ)',
  'Washington Crossing State Park & Visitor Center (Titusville, NJ)',
  'Stony Brook Trail & Currier Woods (Hopewell, NJ)',
  'Fiddler\'s Creek Ravine Preserve (Titusville, NJ)',
  'Woolsey Park & Historic Airfield (Titusville, NJ)',
  'Hopewell Elementary School / Outdoor Classroom',
  'Bear Tavern Elementary School / Outdoor Den & Trail',
  'Toll Gate Grammar School / Courtyard Garden',
  'Timberlane Middle School / Science Lab & Wetlands',
  'Hopewell Valley Central High School',
  'Home Base Learning Studio / Backyard Lab (HVRSD)',
  'Princeton University Campus & Art Museum (Princeton, NJ)',
  'Institute for Advanced Study Woods & Nature Trail (Princeton, NJ)',
  'Herrontown Woods Arboretum & Veblen House (Princeton, NJ)',
  'Mountain Lakes Nature Preserve (Princeton, NJ)',
  'D&R Canal State Park Trail (Mercer/Hunterdon/Somerset, NJ)',
  'Grounds For Sculpture & Museum (Hamilton, NJ)',
  'New Jersey State Museum & Planetarium (Trenton, NJ)',
  'Old Barracks Museum (Trenton, NJ)',
  'Trenton City Museum at Ellarslie (Trenton, NJ)',
  'Sayen House and Gardens (Hamilton, NJ)',
  'John A. Roebling Park & Abbott Marshlands (Hamilton/Trenton, NJ)',

  // Hunterdon & Somerset County Preserves & Farms
  'Sourland Mountain Preserve (Hillsborough / East Amwell, NJ)',
  'Duke Farms & Sustainability Center (Hillsborough, NJ)',
  'Round Valley Recreation Area (Lebanon, NJ)',
  'Spruce Run Recreation Area (Clinton, NJ)',
  'Ken Lockwood Gorge & South Branch Wildlife Area (High Bridge, NJ)',
  'Hunterdon County Arboretum (Lebanon, NJ)',
  'Scherman Hoffman Wildlife Sanctuary (Bernardsville, NJ)',
  'Somerset County Environmental Education Center & Lord Stirling Park (Basking Ridge, NJ)',
  'Columbia Trail (High Bridge / Califon, NJ)',
  'Raritan Headwaters Association & Fairview Farm (Bedminster, NJ)',
  'Black River Wildlife Management Area (Chester, NJ)',

  // Central & Jersey Shore Coastal Sites
  'Island Beach State Park & Interpretive Center (Seaside Park, NJ)',
  'Sandy Hook Unit - Gateway National Recreation Area (Monmouth, NJ)',
  'Cheesequake State Park & Marshes (Old Bridge, NJ)',
  'Allaire State Park & Historic Village (Wall Township, NJ)',
  'Monmouth Battlefield State Park (Manalapan, NJ)',
  'Manasquan Reservoir Environmental Center (Howell, NJ)',
  'Cattus Island County Park & Cooper Environmental Center (Toms River, NJ)',
  'Twin Lights Historic Site (Highlands, NJ)',
  'Barnegat Lighthouse State Park (Barnegat Light, NJ)',
  'Rutgers University Marine Field Station (Tuckerton, NJ)',
  'The Wetlands Institute (Stone Harbor, NJ)',
  'Cape May Point State Park & Hawk Watch Platform (Cape May, NJ)',
  'Cape May Bird Observatory (Cape May Point, NJ)',
  'Nature Center of Cape May (Cape May, NJ)',

  // Pine Barrens & South Jersey Sites
  'Wharton State Forest & Batsto Historic Village (Hammonton, NJ)',
  'Brendan T. Byrne State Forest & Mount Misery (New Lisbon, NJ)',
  'Bass River State Forest (Tuckerton, NJ)',
  'Edwin B. Forsythe National Wildlife Refuge (Galloway / Oceanville, NJ)',
  'Adventure Aquarium (Camden, NJ)',
  'Camden Children\'s Garden (Camden, NJ)',
  'Palmyra Cove Nature Park & Environmental Discovery Center (Palmyra, NJ)',
  'Rancocas Nature Center & State Park (Westampton, NJ)',
  'Pemberton Rail Trail & Cranberry Bogs (Pemberton, NJ)',
  'Parvin State Park (Pittsgrove, NJ)',
  'Estell Manor County Park & Glassworks Ruins (Mays Landing, NJ)',
  'Wheaton Arts and Cultural Center & Glass Museum (Millville, NJ)',

  // North Jersey Highlands, Mountains & Watersheds
  'High Point State Park & Appalachian Trail (Sussex, NJ)',
  'Delaware Water Gap National Recreation Area & Kittatinny Ridge (Warren/Sussex, NJ)',
  'Stokes State Forest & Tillman Ravine (Branchville, NJ)',
  'Swartswood State Park (Swartswood, NJ)',
  'Jenny Jump State Forest & Greenwood Observatory (Hope, NJ)',
  'Allamuchy Mountain State Park & Waterloo Village (Stanhope, NJ)',
  'Hopatcong State Park & Lake Hopatcong Historical Museum (Landing, NJ)',
  'Wawayanda State Park (Hewitt, NJ)',
  'Ringwood State Park & Skylands Botanical Garden (Ringwood, NJ)',
  'Norvin Green State Forest (Bloomingdale, NJ)',
  'Ramapo Mountain State Forest & Van Slyke Castle (Oakland, NJ)',
  'Sterling Hill Mining Museum & Fluorescent Mineral Mine (Ogdensburg, NJ)',
  'Franklin Mineral Museum (Franklin, NJ)',
  'Pequest Trout Hatchery & Natural Resource Education Center (Oxford, NJ)',

  // Northern Urban / Suburban & Science Centers
  'Liberty Science Center & Jennifer Chalsty Planetarium (Jersey City, NJ)',
  'Liberty State Park & Nature Interpretive Center (Jersey City, NJ)',
  'Palisades Interstate Park & Greenbrook Sanctuary (Alpine, NJ)',
  'Thomas Edison National Historical Park & Invention Lab (West Orange, NJ)',
  'Great Falls National Historical Park (Paterson, NJ)',
  'Newark Museum of Art & MakerSPACE (Newark, NJ)',
  'Turtle Back Zoo & Environmental Center (West Orange, NJ)',
  'Tenafly Nature Center (Tenafly, NJ)',
  'Flat Rock Brook Nature Center (Englewood, NJ)',
  'Cora Hartshorn Arboretum & Bird Sanctuary (Short Hills, NJ)',
  'Frelinghuysen Arboretum (Morristown, NJ)',
  'Great Swamp National Wildlife Refuge (Basking Ridge / Harding, NJ)',
  'Jockey Hollow & Morristown National Historical Park (Morristown, NJ)',
  'Montclair Art Museum (Montclair, NJ)',
  'Morris Museum & Murtogh D. Guinness Collection (Morristown, NJ)',
  'Trailside Nature and Science Center & Watchung Reservation (Mountainside, NJ)',
  'Reeves-Reed Arboretum (Summit, NJ)',
  'Rutgers Gardens & Agricultural Experiment Station (New Brunswick, NJ)',
  'Rutgers Geology Museum (New Brunswick, NJ)',
  'Rutgers University Zimmerli Art Museum (New Brunswick, NJ)',
  'East Jersey Old Town Village (Piscataway, NJ)',
];

// Comprehensive 100+ Generic Academic & Exploratory Topics of Study for Step 3
const GENERIC_TOPICS_OF_STUDY = [
  // Physical Sciences, Electricity, Energy & Engineering
  'Electricity, Circuits & Electric Currents',
  'Electromagnetism & Magnetic Fields',
  'Renewable Energy: Solar, Wind & Hydroelectric Power',
  'Physics: Force, Motion, Velocity & Newton\'s Laws',
  'Energy: Kinetic, Potential, Thermal & Mechanical',
  'Light, Optics, Reflection & Refraction',
  'Sound Waves, Acoustics & Frequency',
  'Thermodynamics & Heat Transfer',
  'Simple Machines, Levers, Pulleys & Mechanical Advantage',
  'Robotics, Microcontrollers & Basic Electronics',
  'Engineering Design Process & Structural Prototyping',
  'Aerodynamics & Flight Dynamics',

  // Astronomy, Space Sciences & Earth Science
  'Astronomy: Stars, Galaxies & Deep Space',
  'Space Exploration, Rockets & Orbital Mechanics',
  'Solar System, Planets, Moons & Asteroids',
  'Lunar Phases, Eclipses & Gravitational Tides',
  'Sun, Solar Radiation & Space Weather',
  'Constellations, Star Charts & Celestial Navigation',
  'Earth Science: Plate Tectonics, Earthquakes & Volcanoes',
  'Geology: Rocks, Minerals & Geological Formations',
  'Meteorology: Weather Systems, Fronts & Forecasting',
  'Climate Science, Greenhouse Effect & Atmospheric Cycles',
  'Hydrology, Watershed Dynamics & Water Cycle',
  'Oceanography, Marine Currents & Tides',

  // Life Sciences, Biology & Ecology
  'Biology: Cell Structure, Function & Cell Division',
  'Genetics, DNA, Heredity & Traits',
  'Evolution, Natural Selection & Adaptation',
  'Ecology & Ecosystem Interactions',
  'Freshwater Biology & Aquatic Organisms',
  'Marine Biology & Ocean Ecosystems',
  'Botany: Plant Physiology, Seeds & Photosynthesis',
  'Zoology: Animal Behavior, Anatomy & Classification',
  'Ornithology: Bird Anatomy, Calls & Migration',
  'Entomology: Insects, Arachnids & Metamorphosis',
  'Herpetology: Reptiles & Amphibians',
  'Microbiology: Bacteria, Fungi, Viruses & Protozoa',
  'Soil Science, Microorganisms & Composting',
  'Conservation Biology & Endangered Species',
  'Human Anatomy, Physiology & Organ Systems',

  // Mathematics & Data
  'Applied Mathematics & Word Problems',
  'Arithmetic & Pre-Algebra Operations',
  'Algebra, Equations & Linear Functions',
  'Geometry: Shapes, Angles, Area, Perimeter & Volume',
  'Data Collection, Graphing, Charts & Statistics',
  'Probability, Combinatorics & Logic',
  'Measurement, Metric Conversions & Precision',
  'Computer Science: Algorithms, Logic & Coding',

  // Language Arts & Humanities
  'Reading Comprehension & Novel Study',
  'Creative Writing, Short Stories & Fiction',
  'Poetry, Rhyme, Meter & Figurative Language',
  'Expository Writing, Informational Essays & Reports',
  'Persuasive Writing, Argumentation & Debate',
  'Field Journaling, Observations & Descriptive Writing',
  'Spelling, Vocabulary Building & Etymology',
  'Grammar, Sentence Structure & Editing',
  'Public Speaking, Presentations & Oral Communication',
  'Environmental Literature & Nature Essays',

  // History & Social Studies
  'Local & Regional Community History',
  'United States History & Early Republic',
  'World History & Ancient Civilizations',
  'Civics, Government Structure & Constitution',
  'Elections, Voting & Public Participation',
  'Economics: Scarcity, Trade, Markets & Money',
  'Human Geography, Maps & Cultural Regions',
  'Native American History, Heritage & Culture',
  'Civil Rights, Social Movements & Community Action',
  'Archaeology, Artifacts & Primary Source Analysis',

  // Visual Arts, Music & Practical Skills
  'Drawing, Sketching, Shading & Perspective',
  'Botanical Illustration & Scientific Drawing',
  'Painting: Watercolor, Acrylic & Color Theory',
  'Sculpture, Modeling Clay & 3D Design',
  'Photography, Framing & Visual Storytelling',
  'Music Theory, Rhythm, Melody & Instrumentation',
  'Acoustics, Soundscapes & Field Audio Recording',
  'Agricultural Skills, Crop Planting & Garden Care',
  'Culinary Arts, Food Chemistry & Nutrition',
  'Woodworking, Tool Safety & Craftsmanship',

  // Physical Education & Outdoor Skills
  'Physical Fitness, Cardio & Muscular Endurance',
  'Trail Running, Hiking & Distance Walking',
  'Yoga, Stretching & Mindful Movement',
  'Orienteering, Topographic Maps & Compass Use',
  'Outdoor Survival Skills, Shelter & Knotcraft',
  'First Aid Basics, Wilderness Safety & Preparedness',
];

// Step 4: Generic Sensory Inquiry Prompts
const SENSORY_PROMPTS = [
  { label: '👁️ What caught your eye?', insertText: 'Visual Details: ' },
  { label: '👂 What sounds did you notice?', insertText: 'Sounds Heard: ' },
  { label: '✋ What textures/temperatures did you feel?', insertText: 'Textures/Feel: ' },
  { label: '👃 What scents or air quality did you detect?', insertText: 'Scents/Air: ' },
];

// Step 4: Guiding Reflection Questions
const REFLECTION_QUESTIONS = [
  { label: '💡 How does this connect to what you learned before?', prompt: 'Connection to prior learning: ' },
  { label: '🌍 How does this affect people or nature?', prompt: 'Real-world impact: ' },
  { label: '🤔 What surprised you the most?', prompt: 'What surprised me: ' },
  { label: '❓ What question do you still want to explore?', prompt: 'Question I still have: ' },
];

// Helper to get current HH:MM for native time picker
const getCurrentTimeHHMM = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper to format HH:MM into a friendly display string (e.g. 9:15 AM EDT)
const formatTimeForDisplay = (hhmm) => {
  if (!hhmm) return 'Not recorded';
  const parts = hhmm.split(':');
  if (parts.length < 2) return hhmm;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm} EDT`;
};

const DUMMY_STUDENTS = {
  maya: {
    id: 'maya',
    studentName: 'Maya Lin',
    school: 'Bear Tavern Elementary',
    grade: '5th Grade',
    caregiverName: 'Sarah Lin',
    date: new Date().toISOString().split('T')[0],
    checkInTime: getCurrentTimeHHMM(),
    isCheckedIn: true,
    location: '',
    hoursBreakdown: {
      literacy: 0,
      stem: 0,
      community: 0,
      movement: 0,
    },
    subjectArea: '',
    keyLearnings: '',
    holisticReflection: '',
    sensoryObservations: '',
    certified: false,
    signatureType: 'type',
    signatureData: 'Sarah Lin (Caregiver) & Maya Lin (Student)',
    logId: 'ECO-NJ-2026-8492M',
  },
  liam: {
    id: 'liam',
    studentName: 'Liam Chen',
    school: 'Timberlane Middle School',
    grade: '8th Grade',
    caregiverName: 'David Chen',
    date: new Date().toISOString().split('T')[0],
    checkInTime: getCurrentTimeHHMM(),
    isCheckedIn: true,
    location: '',
    hoursBreakdown: {
      literacy: 0,
      stem: 0,
      community: 0,
      movement: 0,
    },
    subjectArea: '',
    keyLearnings: '',
    holisticReflection: '',
    sensoryObservations: '',
    certified: false,
    signatureType: 'type',
    signatureData: 'David Chen (Caregiver) & Liam Chen (Student)',
    logId: 'ECO-NJ-2026-3174L',
  },
};

const BLANK_FORM = {
  id: 'custom',
  studentName: '',
  school: 'Bear Tavern Elementary',
  grade: '5th Grade',
  caregiverName: '',
  date: new Date().toISOString().split('T')[0],
  checkInTime: getCurrentTimeHHMM(),
  isCheckedIn: true,
  location: '',
  hoursBreakdown: {
    literacy: 0,
    stem: 0,
    community: 0,
    movement: 0,
  },
  subjectArea: '',
  keyLearnings: '',
  holisticReflection: '',
  sensoryObservations: '',
  certified: false,
  signatureType: 'type',
  signatureData: '',
  logId: '',
};

const HVRSD_SCHOOLS = [
  'Bear Tavern Elementary',
  'Hopewell Elementary',
  'Stony Brook Elementary',
  'Toll Gate Grammar School',
  'Timberlane Middle School',
  'Hopewell Valley Central High School',
];

const GRADES = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

const STEPS = [
  'Attendance, Date & Location',
  'Instructional Hours',
  'Key Learnings',
  'Observations & Reflection',
  'Sign & Submit',
];

export default function LearningLogWizard() {
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('maya');
  const [formData, setFormData] = useState(DUMMY_STUDENTS.maya);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionDate, setSubmissionDate] = useState(null);
  const [signatureMode, setSignatureMode] = useState('type');
  const [isDrawing, setIsDrawing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCaregiver, setCustomCaregiver] = useState('');
  const [customSchool, setCustomSchool] = useState('Bear Tavern Elementary');
  const [customGrade, setCustomGrade] = useState('5th Grade');
  const [validationError, setValidationError] = useState('');
  
  // Autocomplete dropdown state
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [topicSearchOpen, setTopicSearchOpen] = useState(false);
  
  const canvasRef = useRef(null);

  // Total Hours calculation
  const totalHours = Object.values(formData.hoursBreakdown).reduce((acc, h) => acc + (parseFloat(h) || 0), 0);

  useEffect(() => {
    if (!formData.logId) {
      const code = Math.floor(1000 + Math.random() * 9000);
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      setFormData(prev => ({
        ...prev,
        logId: `ECO-NJ-2026-${code}${letter}`,
      }));
    }
  }, []);

  const handleSelectStudent = (personaKey) => {
    setSelectedPersona(personaKey);
    setValidationError('');
    
    if (personaKey === 'maya') {
      setFormData({
        ...DUMMY_STUDENTS.maya,
        date: new Date().toISOString().split('T')[0],
        checkInTime: getCurrentTimeHHMM(),
      });
    } else if (personaKey === 'liam') {
      setFormData({
        ...DUMMY_STUDENTS.liam,
        date: new Date().toISOString().split('T')[0],
        checkInTime: getCurrentTimeHHMM(),
      });
    }

    setShowLoginModal(false);
    setCurrentStep(0);
    window.scrollTo({ top: 40, behavior: 'smooth' });
  };

  const handleCustomStudentSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      setValidationError('Please enter student name.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000);
    const customData = {
      ...BLANK_FORM,
      studentName: customName.trim(),
      caregiverName: customCaregiver.trim() || 'Parent / Guardian',
      school: customSchool,
      grade: customGrade,
      date: new Date().toISOString().split('T')[0],
      checkInTime: getCurrentTimeHHMM(),
      logId: `ECO-NJ-2026-${code}X`,
    };

    setSelectedPersona('custom');
    setFormData(customData);
    setShowLoginModal(false);
    setCurrentStep(0);
    window.scrollTo({ top: 40, behavior: 'smooth' });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const updateHour = (category, value) => {
    const val = value === '' ? 0 : parseFloat(value);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setFormData(prev => ({
      ...prev,
      hoursBreakdown: { ...prev.hoursBreakdown, [category]: num },
    }));
  };

  const handleInsertPrompt = (field, promptText) => {
    setFormData(prev => {
      const current = prev[field].trim();
      const nextText = current ? `${current}\n\n${promptText}` : promptText;
      return { ...prev, [field]: nextText };
    });
  };

  const handleSkipOrNA = () => {
    setValidationError('');
    if (currentStep === 2) {
      if (!formData.subjectArea) updateField('subjectArea', 'General Studies (N/A)');
      if (!formData.keyLearnings) updateField('keyLearnings', 'N/A');
    }
    if (currentStep === 3) {
      if (!formData.sensoryObservations) updateField('sensoryObservations', 'N/A');
      if (!formData.holisticReflection) updateField('holisticReflection', 'N/A');
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 40, behavior: 'smooth' });
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#B05B3B';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      updateField('signatureData', canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      updateField('signatureData', '');
    }
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!formData.date) {
        return 'Please select the learning date.';
      }
      if (!formData.checkInTime) {
        return 'Please set your check-in time.';
      }
      if (!formData.location.trim()) {
        return 'Please enter or select your learning location in New Jersey.';
      }
    }
    if (step === 1) {
      if (totalHours < 4.0) {
        return `N.J.A.C. 6A:32-8.3 requires at least 4.0 total hours. Currently logged: ${totalHours.toFixed(1)} hrs.`;
      }
    }
    if (step === 4) {
      if (!formData.certified) {
        return 'Please check the certification box.';
      }
      if (signatureMode === 'type' && !formData.signatureData.trim()) {
        return 'Please enter a signature.';
      }
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 40, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    setValidationError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 40, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    const error = validateStep(4);
    if (error) {
      setValidationError(error);
      return;
    }
    const submissionTimestamp = new Date().toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setSubmissionDate(submissionTimestamp);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForNew = () => {
    setIsSubmitted(false);
    setShowLoginModal(true);
  };

  // Filter Locations in NJ (case-insensitive substring search)
  const filteredLocations = NJ_EDUCATIONAL_PLACES.filter(loc =>
    !formData.location || loc.toLowerCase().includes(formData.location.toLowerCase())
  );

  // Filter Topics of Study (case-insensitive substring search)
  const filteredTopics = GENERIC_TOPICS_OF_STUDY.filter(topic =>
    !formData.subjectArea || topic.toLowerCase().includes(formData.subjectArea.toLowerCase())
  );

  // ==========================================
  // FINAL REPORT: CLEAN & SPACIOUS
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        
        {/* Confirmation Header */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-8 text-center print:hidden">
          <div className="text-2xl mb-1">🌿</div>
          <h2 className="text-xl font-bold text-stone-900">
            Learning Log Filed
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 mb-4">
            Official record generated for <strong>{formData.studentName}</strong> (Log ID: {formData.logId}).
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#B05B3B] hover:bg-[#8F4428] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all"
            >
              Print / Save PDF
            </button>
            <button
              onClick={handleResetForNew}
              className="bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold px-5 py-2.5 rounded-full border border-stone-300"
            >
              Start New Entry
            </button>
          </div>
        </div>

        {/* Printable Formal Document */}
        <div id="printable-record" className="bg-white border border-stone-300 rounded-2xl p-8 sm:p-12 shadow-sm text-stone-900 space-y-8">
          
          {/* Header */}
          <div className="border-b border-stone-800 pb-5 flex justify-between items-end">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#B05B3B]">
                Hopewell Valley Regional School District
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                Independent Learning Log
              </h1>
              <div className="text-xs text-stone-500 font-mono mt-0.5">
                N.J.A.C. 6A:32-8.3 (4.0-Hour Daily Equivalent)
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded border">
                ID: {formData.logId}
              </span>
            </div>
          </div>

          {/* Student Information Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block uppercase font-semibold text-[10px]">Student</span>
              <span className="font-bold text-stone-900 text-sm">{formData.studentName}</span>
            </div>
            <div>
              <span className="text-stone-500 block uppercase font-semibold text-[10px]">Grade & School</span>
              <span className="font-semibold text-stone-800">{formData.grade}, {formData.school}</span>
            </div>
            <div>
              <span className="text-stone-500 block uppercase font-semibold text-[10px]">Caregiver</span>
              <span className="font-semibold text-stone-800">{formData.caregiverName}</span>
            </div>
            <div>
              <span className="text-stone-500 block uppercase font-semibold text-[10px]">Date</span>
              <span className="font-semibold text-stone-800">{formData.date}</span>
            </div>
          </div>

          {/* Attendance & Hours Summary */}
          <div className="space-y-3 border-b border-stone-200 pb-6 text-xs">
            <h3 className="font-bold uppercase text-[11px] text-stone-500 tracking-wider">
              Attendance & Instructional Time
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px]">Morning Check-In</span>
                <span className="font-bold text-stone-800">{formatTimeForDisplay(formData.checkInTime)}</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px]">Learning Location</span>
                <span className="font-bold text-stone-800">{formData.location || 'Local Field Site'}</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px]">Total Hours Logged</span>
                <span className="font-bold text-emerald-800 text-sm">{totalHours.toFixed(1)} Hours Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-stone-600">
              <div>Literacy: <strong>{formData.hoursBreakdown.literacy}h</strong></div>
              <div>STEM: <strong>{formData.hoursBreakdown.stem}h</strong></div>
              <div>Community: <strong>{formData.hoursBreakdown.community}h</strong></div>
              <div>Movement: <strong>{formData.hoursBreakdown.movement}h</strong></div>
            </div>
          </div>

          {/* Learning Notes */}
          <div className="space-y-4 border-b border-stone-200 pb-6 text-xs">
            <h3 className="font-bold uppercase text-[11px] text-stone-500 tracking-wider">
              Evidence of Learning
            </h3>

            {formData.subjectArea && formData.subjectArea !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Topic / Subject Area:</span>
                <span className="font-semibold text-stone-900 text-sm">{formData.subjectArea}</span>
              </div>
            )}

            {formData.keyLearnings && formData.keyLearnings !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Key Learnings & Observations:</span>
                <p className="text-stone-800 mt-1 leading-relaxed whitespace-pre-wrap">{formData.keyLearnings}</p>
              </div>
            )}

            {formData.sensoryObservations && formData.sensoryObservations !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Sensory Observations:</span>
                <p className="text-stone-800 mt-1 leading-relaxed whitespace-pre-wrap">{formData.sensoryObservations}</p>
              </div>
            )}

            {formData.holisticReflection && formData.holisticReflection !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Holistic Reflection:</span>
                <p className="text-stone-800 mt-1 leading-relaxed whitespace-pre-wrap">{formData.holisticReflection}</p>
              </div>
            )}
          </div>

          {/* Sign-Off with Dynamic Actual Hours Logged */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs">
            <div className="text-stone-600 space-y-1">
              <p className="leading-relaxed">
                <strong>Statutory Certification:</strong> I certify that {formData.studentName} completed <strong>{totalHours.toFixed(1)} hours</strong> of structured educational activity today under New Jersey state instructional day equivalency standards (N.J.A.C. 6A:32-8.3).
              </p>
              <div className="text-stone-400 text-[11px]">
                Filed via ecoPTO.org • {submissionDate || new Date().toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-stone-500 mb-1">Student / Caregiver Signature:</div>
              <div className="border-b border-stone-800 pb-1 font-serif italic text-base text-stone-900">
                {formData.signatureData?.startsWith('data:') ? (
                  <img src={formData.signatureData} alt="Signature" className="h-10 mx-auto object-contain" />
                ) : (
                  formData.signatureData || `${formData.caregiverName} & ${formData.studentName}`
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // WIZARD INTERFACE
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      
      {/* STUDENT PICKER MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Who is Learning Today?
              </h2>
              <p className="text-xs text-stone-500">
                Select a profile to start today's log:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectStudent('maya')}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-[#B05B3B] hover:bg-stone-50 text-left transition-all"
              >
                <div className="text-2xl mb-1">🦉</div>
                <div className="font-bold text-stone-900 text-sm">Maya Lin</div>
                <div className="text-xs text-stone-500">5th Gr • Bear Tavern</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStudent('liam')}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-[#B05B3B] hover:bg-stone-50 text-left transition-all"
              >
                <div className="text-2xl mb-1">🦦</div>
                <div className="font-bold text-stone-900 text-sm">Liam Chen</div>
                <div className="text-xs text-stone-500">8th Gr • Timberlane</div>
              </button>
            </div>

            <div className="border-t border-stone-200 pt-3">
              <details className="group">
                <summary className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer list-none flex justify-between items-center">
                  <span>+ Enter custom student</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <form onSubmit={handleCustomStudentSubmit} className="mt-3 space-y-3 pt-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Student Name *"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                  <input
                    type="text"
                    value={customCaregiver}
                    onChange={(e) => setCustomCaregiver(e.target.value)}
                    placeholder="Caregiver Name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    >
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    >
                      {HVRSD_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    Start Entry
                  </button>
                </form>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Active Student Header */}
      <div className="flex items-center justify-between text-xs text-stone-600 mb-3 px-1">
        <div>
          Logging for <strong>{formData.studentName}</strong> ({formData.grade})
        </div>
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          className="text-[#B05B3B] hover:underline font-semibold"
        >
          Switch Student
        </button>
      </div>

      {/* Clean Form Card */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-xs">
          <span className="font-bold text-stone-800">
            Step {currentStep + 1} of {STEPS.length}: <span className="font-normal text-stone-500">{STEPS[currentStep]}</span>
          </span>
          <span className="text-stone-400 font-mono">
            {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
          </span>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {validationError}
          </div>
        )}

        {/* STEP 0: Attendance Time Picker, Date Picker & Searchable NJ Location */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Attendance, Date & Location
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Set your learning date, check-in time, and location in New Jersey.
              </p>
            </div>

            {/* Date & Time Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  📅 Learning Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
                />
              </div>

              {/* Time Picker */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    ⏰ Morning Check-In Time *
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField('checkInTime', getCurrentTimeHHMM())}
                    className="text-[11px] text-[#B05B3B] hover:text-[#8F4428] font-bold underline"
                  >
                    ⚡ Set to Now
                  </button>
                </div>
                <input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => updateField('checkInTime', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
                />
              </div>
            </div>

            {/* Typeable / Searchable 100+ NJ Locations List */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Where did you learn today? (Type a location in New Jersey) *
              </label>
              <p className="text-[11px] text-stone-500 mb-1.5">
                Type any park, preserve, library, nature center, museum, home base, or field site:
              </p>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  updateField('location', e.target.value);
                  setLocationSearchOpen(true);
                }}
                onFocus={() => setLocationSearchOpen(true)}
                placeholder="Type e.g. Mercer Meadows, Baldpate, Watershed, Liberty Science, Home..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
              />

              {/* Suggestions dropdown */}
              {locationSearchOpen && (
                <div className="mt-1 max-h-56 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 space-y-0.5 z-30">
                  <div className="text-[10px] font-bold uppercase text-stone-400 px-2 py-1 flex justify-between items-center">
                    <span>NJ Educational Places ({filteredLocations.length})</span>
                    <button
                      type="button"
                      onClick={() => setLocationSearchOpen(false)}
                      className="text-stone-500 hover:text-stone-800 text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {filteredLocations.slice(0, 10).map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        updateField('location', loc);
                        setLocationSearchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-amber-50 hover:text-[#B05B3B] rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>{loc}</span>
                      <span className="text-[10px] text-stone-400">Select</span>
                    </button>
                  ))}
                  {filteredLocations.length === 0 && (
                    <div className="px-3 py-2 text-xs text-stone-500">
                      Using custom location: <strong>"{formData.location}"</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: 4-Hour Time Attestation (Starts at 0) */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Instructional Hours
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Enter your hours spent today (must total at least 4.0 hours for N.J.A.C. 6A:32-8.3 compliance).
              </p>
            </div>

            {/* Totalizer */}
            <div className={`p-4 rounded-xl border text-center ${
              totalHours >= 4.0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="text-xs text-stone-500 font-semibold uppercase">Total Hours Logged</div>
              <div className="text-2xl font-bold text-stone-900">{totalHours.toFixed(1)} Hours</div>
              <div className={`text-xs font-medium mt-0.5 ${totalHours >= 4.0 ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                {totalHours >= 4.0 ? '✓ Minimum 4.0 Hours Satisfied' : `Needs ${(4.0 - totalHours).toFixed(1)} more hours to meet 4.0 hr requirement`}
              </div>
            </div>

            {/* 4 Category Hours Inputs (Start at 0) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">📖 Literacy & Reading</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="8"
                  value={formData.hoursBreakdown.literacy === 0 ? '' : formData.hoursBreakdown.literacy}
                  placeholder="0.0"
                  onChange={(e) => updateHour('literacy', e.target.value)}
                  className="w-16 p-1.5 text-center font-bold border rounded bg-white text-stone-900"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🔬 STEM, Science & Math</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="8"
                  value={formData.hoursBreakdown.stem === 0 ? '' : formData.hoursBreakdown.stem}
                  placeholder="0.0"
                  onChange={(e) => updateHour('stem', e.target.value)}
                  className="w-16 p-1.5 text-center font-bold border rounded bg-white text-stone-900"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🏛️ Community & Civics</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="8"
                  value={formData.hoursBreakdown.community === 0 ? '' : formData.hoursBreakdown.community}
                  placeholder="0.0"
                  onChange={(e) => updateHour('community', e.target.value)}
                  className="w-16 p-1.5 text-center font-bold border rounded bg-white text-stone-900"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🏃 Movement & Wellness</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="8"
                  value={formData.hoursBreakdown.movement === 0 ? '' : formData.hoursBreakdown.movement}
                  placeholder="0.0"
                  onChange={(e) => updateHour('movement', e.target.value)}
                  className="w-16 p-1.5 text-center font-bold border rounded bg-white text-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Topic Search (100+ Topics) & Discoveries */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                What did you study today?
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Type any subject or topic of study (e.g. Electricity, Space, Biology, Fractions, US History...).
              </p>
            </div>

            {/* Broad Topic Search */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Topic of Study *
              </label>
              <input
                type="text"
                value={formData.subjectArea}
                onChange={(e) => {
                  updateField('subjectArea', e.target.value);
                  setTopicSearchOpen(true);
                }}
                onFocus={() => setTopicSearchOpen(true)}
                placeholder="Type e.g. Electricity, Space, Ecology, Chemistry, History, Geometry..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
              />

              {/* Suggestions dropdown */}
              {topicSearchOpen && (
                <div className="mt-1 max-h-52 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 space-y-0.5 z-30">
                  <div className="text-[10px] font-bold uppercase text-stone-400 px-2 py-1 flex justify-between items-center">
                    <span>Suggested Topics ({filteredTopics.length})</span>
                    <button
                      type="button"
                      onClick={() => setTopicSearchOpen(false)}
                      className="text-stone-500 hover:text-stone-800 text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {filteredTopics.slice(0, 10).map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        updateField('subjectArea', topic);
                        setTopicSearchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-amber-50 hover:text-[#B05B3B] rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>{topic}</span>
                      <span className="text-[10px] text-stone-400">Select</span>
                    </button>
                  ))}
                  {filteredTopics.length === 0 && (
                    <div className="px-3 py-2 text-xs text-stone-500">
                      Using custom topic: <strong>"{formData.subjectArea}"</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key Discoveries */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Key Discoveries & Concepts</label>
              <textarea
                rows="3"
                value={formData.keyLearnings}
                onChange={(e) => updateField('keyLearnings', e.target.value)}
                placeholder="What did you observe, calculate, build, read, or discover today?"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Sensory Observations & Guiding Reflection Questions */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Observations & Reflection
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Record sensory details and thoughtful reflections (tap question prompts below for inspiration):
              </p>
            </div>

            {/* Sensory Observations with Generic Starter Prompts */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700">Sensory Observations</label>
                <span className="text-[11px] text-[#B05B3B] font-semibold">Tap to insert prompt ⤵</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SENSORY_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt('sensoryObservations', item.insertText)}
                    className="bg-stone-50 hover:bg-amber-50 hover:border-[#B05B3B] text-stone-700 hover:text-[#B05B3B] px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] font-medium transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                rows="2"
                value={formData.sensoryObservations}
                onChange={(e) => updateField('sensoryObservations', e.target.value)}
                placeholder="Note what you saw, heard, touched, or measured..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>

            {/* Holistic Reflection with Guiding Questions */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700">Holistic Reflection</label>
                <span className="text-[11px] text-[#B05B3B] font-semibold">Tap to add thinking question ⤵</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {REFLECTION_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt('holisticReflection', q.prompt)}
                    className="bg-stone-50 hover:bg-amber-50 hover:border-[#B05B3B] text-stone-700 hover:text-[#B05B3B] px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] font-medium transition-all"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <textarea
                rows="2"
                value={formData.holisticReflection}
                onChange={(e) => updateField('holisticReflection', e.target.value)}
                placeholder="How does this relate to broader nature, community, or real life?"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Sign & Submit with Exact Hours Logged */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Verification & Sign-Off
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Certify <strong>{totalHours.toFixed(1)} hours</strong> of educational activity today under N.J.A.C. 6A:32-8.3.
              </p>
            </div>

            {/* Certification with Exact Hours Logged */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.certified}
                  onChange={(e) => updateField('certified', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#B05B3B]"
                />
                <span className="text-xs text-stone-900 leading-relaxed font-medium">
                  [ ✓ ] I certify that <strong>{formData.studentName}</strong> completed <strong>{totalHours.toFixed(1)} hours</strong> of structured educational activity today in accordance with New Jersey state instructional day equivalency standards (N.J.A.C. 6A:32-8.3).
                </span>
              </label>
            </div>

            {/* Signature */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-700">Digital Signature</label>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSignatureMode('type')}
                    className={`px-2 py-0.5 rounded ${signatureMode === 'type' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}
                  >
                    Type
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    className={`px-2 py-0.5 rounded ${signatureMode === 'draw' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}
                  >
                    Draw
                  </button>
                </div>
              </div>

              {signatureMode === 'type' ? (
                <input
                  type="text"
                  value={formData.signatureData?.startsWith('data:') ? '' : formData.signatureData}
                  onChange={(e) => updateField('signatureData', e.target.value)}
                  placeholder="Type student/caregiver name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 font-serif italic"
                />
              ) : (
                <div className="border border-stone-300 rounded-xl p-2 bg-stone-50 text-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full max-w-[400px] h-[100px] bg-white border rounded mx-auto cursor-crosshair touch-none"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 max-w-[400px] mx-auto mt-1 px-1">
                    <span>Draw signature</span>
                    <button type="button" onClick={clearCanvas} className="text-red-500">Clear</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5"
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3">
            {[2, 3].includes(currentStep) && (
              <button
                type="button"
                onClick={handleSkipOrNA}
                className="text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                Skip / N/A →
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#B05B3B] hover:bg-[#8F4428] text-white text-xs font-bold px-5 py-2 rounded-full shadow-sm transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm transition-all"
              >
                Submit Learning Log
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
