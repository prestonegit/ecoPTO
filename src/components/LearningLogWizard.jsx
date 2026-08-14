import React, { useState, useEffect, useRef } from 'react';

// Generic K-12 Academic & Exploratory Topics of Study
const GENERIC_TOPICS_OF_STUDY = [
  // Sciences & Nature
  'Ecology & Ecosystem Dynamics',
  'Freshwater Biology & Water Quality',
  'Botany, Plant Anatomy & Photosynthesis',
  'Zoology, Animal Behavior & Habitats',
  'Ornithology (Bird Studies & Migration)',
  'Entomology & Pollinator Life Cycles',
  'Earth Science, Geology & Mineralogy',
  'Meteorology, Weather Patterns & Climate',
  'Environmental Science & Conservation Biology',
  'Microbiology & Pond Microscopy',
  'Physics: Energy, Force & Fluid Mechanics',
  'Chemistry & Soil Nutrient Cycles',
  'Astronomy, Celestial Cycles & Constellations',
  'Evolution, Adaptation & Biodiversity',

  // Mathematics, Data & Applied STEM
  'Applied Mathematics & Field Geometry',
  'Data Collection, Sampling & Statistical Analysis',
  'Topography, Elevation & Contour Mapping',
  'Renewable Energy & Solar Engineering',
  'Simple Machines & Mechanical Physics',

  // Language Arts & Humanities
  'Field Journaling & Expository Writing',
  'Nature Poetry & Creative Writing',
  'Literature Analysis & Close Reading',
  'Environmental Philosophy & Nature Literature',
  'Local History & Archival Primary Sources',
  'Civics, Public Policy & Environmental Law',
  'Cultural Geography & Human-Environment Interaction',
  'Archaeology, Anthropology & Material Culture',

  // Arts, Agriculture & Practical Skills
  'Botanical Illustration & Scientific Sketching',
  'Landscape Painting & Visual Arts',
  'Acoustic Ecology & Soundscape Analysis',
  'Agricultural Science & Crop Cultivation',
  'Horticulture, Soil Biology & Composting',
  'Nutrition, Food Systems & Culinary Arts',

  // Health, Movement & Outdoor Skills
  'Physical Fitness, Trail Running & Kinesthetics',
  'Mindful Movement, Meditation & Wellness',
  'Wilderness Orienteering & Compass Navigation',
  'Field Safety, Survival Skills & Knotcraft',
];

// Rich set of locations (Local Field Sites, Nature Centers, Home Bases & Custom)
const LOCATION_OPTIONS = [
  'Mercer Meadows & Nature Center',
  'St. Michaels Farm Preserve',
  'Hopewell Public Library',
  'Baldpate Mountain Preserve',
  'Howell Living History Farm',
  'Watershed Institute Reserve',
  'Home Base / Study Space',
  'School Community Garden',
  'Rosedale Park & Lake',
  'Washington Crossing State Park',
  'Other / Custom Field Site',
];

// Tap-to-Fill Sensory Observation Chips (Ages 6 to 16)
const SENSORY_CHIPS = [
  { sense: 'sight', emoji: '👁️', label: 'Heron in Shallows', text: 'Saw a great blue heron hunting in the shallows' },
  { sense: 'sight', emoji: '👁️', label: 'Sunlight on Water', text: 'Saw sunlight sparkling on clear water riffles' },
  { sense: 'sight', emoji: '👁️', label: 'Bumblebees on Flowers', text: 'Saw bumblebees dusted with yellow pollen' },
  { sense: 'sight', emoji: '👁️', label: 'Animal Tracks', text: 'Noticed animal tracks along the muddy trail' },
  { sense: 'sight', emoji: '👁️', label: 'Tree Canopy Layers', text: 'Observed the layered tree canopy and leaf shapes' },
  { sense: 'sound', emoji: '👂', label: 'Birds Calling', text: 'Heard songbirds calling in the trees' },
  { sense: 'sound', emoji: '👂', label: 'Rushing Water', text: 'Heard the sound of rushing water over pebbles' },
  { sense: 'sound', emoji: '👂', label: 'Wind in Leaves', text: 'Heard wind rustling through tall canopy leaves' },
  { sense: 'smell', emoji: '👃', label: 'Damp Pine / Cedar', text: 'Smelled damp pine needles and cedar bark' },
  { sense: 'smell', emoji: '👃', label: 'Fresh Rain / Soil', text: 'Smelled fresh rain on rich forest soil' },
  { sense: 'smell', emoji: '👃', label: 'Sweet Clover / Flowers', text: 'Smelled sweet clover blooming in the meadow' },
  { sense: 'touch', emoji: '✋', label: 'Cold Spring Water', text: 'Felt cold 56°F spring water' },
  { sense: 'touch', emoji: '✋', label: 'Smooth Creek Rock', text: 'Touched smooth, rounded river stones' },
  { sense: 'touch', emoji: '✋', label: 'Rough Tree Bark', text: 'Felt the rough ridges of oak bark' },
  { sense: 'touch', emoji: '✋', label: 'Soft Velvet Moss', text: 'Felt soft green moss on a fallen log' },
];

const REFLECTION_CHIPS = [
  '🌱 Trees and shade keep water cool so aquatic life can survive summer temperatures.',
  '🐝 Protecting wildflowers gives pollinators the continuous food source they need.',
  '💧 Forests filter rainwater naturally through deep soil layers before it enters streams.',
  '🏡 Preserving open green spaces creates connected corridors for migrating wildlife.',
  '🌾 Healthy, uncompacted soil stores significantly more moisture during dry spells.',
  '🧘 Quiet observation makes academic concepts feel tangible and easy to remember.',
];

const DUMMY_STUDENTS = {
  maya: {
    id: 'maya',
    studentName: 'Maya Lin',
    school: 'Bear Tavern Elementary',
    grade: '5th Grade',
    caregiverName: 'Sarah Lin',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '8:45 AM EDT',
    isCheckedIn: true,
    location: 'Mercer Meadows & Nature Center',
    customLocation: '',
    hoursBreakdown: {
      literacy: 1.0,
      stem: 2.0,
      community: 0.5,
      movement: 1.0,
    },
    subjectArea: 'Freshwater Biology & Water Quality',
    keyLearnings: 'Discovered that mayfly and caddisfly nymphs indicate clean, high-oxygen stream water.',
    holisticReflection: 'Upstream forest canopies keep water cool and protect vulnerable freshwater species.',
    sensoryObservations: 'Saw sunlight sparkling on clear water riffles; heard songbirds calling in the trees; smelled damp cedar bark; felt cold 56°F spring water.',
    certified: true,
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
    checkInTime: '9:10 AM EDT',
    isCheckedIn: true,
    location: 'St. Michaels Farm Preserve',
    customLocation: '',
    hoursBreakdown: {
      literacy: 1.5,
      stem: 1.5,
      community: 1.0,
      movement: 1.0,
    },
    subjectArea: 'Agricultural Science & Crop Cultivation',
    keyLearnings: 'Analyzed organic matter depth across three field transects in late spring.',
    holisticReflection: 'Connected municipal conservation policies with regional pollinator biodiversity.',
    sensoryObservations: 'Saw bumblebees dusted with yellow pollen; smelled sweet clover blooming in the meadow; felt coarse clay-loam soil.',
    certified: true,
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
  checkInTime: '',
  isCheckedIn: false,
  location: 'Mercer Meadows & Nature Center',
  customLocation: '',
  hoursBreakdown: {
    literacy: 1.0,
    stem: 1.5,
    community: 0.5,
    movement: 1.0,
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
  'Attendance & Location',
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
  const [topicSearchOpen, setTopicSearchOpen] = useState(false);
  const canvasRef = useRef(null);

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
      setFormData({ ...DUMMY_STUDENTS.maya, date: new Date().toISOString().split('T')[0] });
    } else if (personaKey === 'liam') {
      setFormData({ ...DUMMY_STUDENTS.liam, date: new Date().toISOString().split('T')[0] });
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
      logId: `ECO-NJ-2026-${code}X`,
    };

    setSelectedPersona('custom');
    setFormData(customData);
    setShowLoginModal(false);
    setCurrentStep(0);
    window.scrollTo({ top: 40, behavior: 'smooth' });
  };

  const handleCheckInStamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' EDT';
    setFormData(prev => ({
      ...prev,
      isCheckedIn: true,
      checkInTime: timeStr,
    }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const updateHour = (category, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setFormData(prev => ({
      ...prev,
      hoursBreakdown: { ...prev.hoursBreakdown, [category]: num },
    }));
  };

  const handleAddSensoryChip = (chipText) => {
    setFormData(prev => {
      const current = prev.sensoryObservations.trim();
      const nextText = current ? `${current}; ${chipText.toLowerCase()}` : chipText;
      return { ...prev, sensoryObservations: nextText };
    });
  };

  const handleAddReflectionChip = (chipText) => {
    setFormData(prev => {
      const current = prev.holisticReflection.trim();
      const nextText = current ? `${current} ${chipText}` : chipText;
      return { ...prev, holisticReflection: nextText };
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
      if (!formData.isCheckedIn && !formData.checkInTime) {
        return 'Please stamp morning check-in.';
      }
      if (formData.location === 'Other / Custom Field Site' && !formData.customLocation.trim()) {
        return 'Please specify your custom location name.';
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

  // Filter generic topics of study
  const filteredTopics = GENERIC_TOPICS_OF_STUDY.filter(t => 
    !formData.subjectArea || t.toLowerCase().includes(formData.subjectArea.toLowerCase())
  );

  const displayLocation = formData.location === 'Other / Custom Field Site' && formData.customLocation
    ? formData.customLocation
    : formData.location;

  // ==========================================
  // FINAL REPORT: CLEAN & SPACIOUS
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        
        {/* Simple Confirmation Header */}
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
                <span className="font-bold text-stone-800">{formData.checkInTime || '8:45 AM EDT'}</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px]">Primary Location</span>
                <span className="font-bold text-stone-800">{displayLocation}</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px]">Total Hours</span>
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
                <p className="text-stone-800 mt-1 leading-relaxed">{formData.keyLearnings}</p>
              </div>
            )}

            {formData.sensoryObservations && formData.sensoryObservations !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Sensory Observations:</span>
                <p className="text-stone-800 mt-1 leading-relaxed">{formData.sensoryObservations}</p>
              </div>
            )}

            {formData.holisticReflection && formData.holisticReflection !== 'N/A' && (
              <div>
                <span className="font-bold text-stone-600 block text-[11px]">Holistic Reflection:</span>
                <p className="text-stone-800 mt-1 leading-relaxed">{formData.holisticReflection}</p>
              </div>
            )}
          </div>

          {/* Sign-Off */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs">
            <div className="text-stone-600 space-y-1">
              <p className="leading-relaxed">
                <strong>Certification:</strong> I certify that the student named above completed at least 4.0 hours of educational activity today under N.J.A.C. 6A:32-8.3.
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
  // WIZARD CARDS
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

        {/* STEP 0: Attendance & Expanded Locations */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Morning Attendance Check-In
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Record your daily check-in by 9:30 AM and select your learning site.
              </p>
            </div>

            {/* Timestamp Button */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
              {formData.isCheckedIn ? (
                <div className="text-emerald-700 text-sm font-semibold">
                  ✓ Check-In Recorded: {formData.checkInTime}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckInStamp}
                  className="bg-[#B05B3B] hover:bg-[#8F4428] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm"
                >
                  ⚡ Record 9:30 AM Check-In
                </button>
              )}
            </div>

            {/* Expanded Location Options */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Primary Learning Location:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LOCATION_OPTIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => updateField('location', loc)}
                    className={`p-2.5 text-xs text-left rounded-lg border transition-colors ${
                      formData.location === loc
                        ? 'border-[#B05B3B] bg-stone-50 text-stone-900 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {/* Custom Location Text Input if "Other / Custom Field Site" selected */}
              {formData.location === 'Other / Custom Field Site' && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Specify Location Name *</label>
                  <input
                    type="text"
                    value={formData.customLocation}
                    onChange={(e) => updateField('customLocation', e.target.value)}
                    placeholder="e.g. Stony Brook Trailhead, Backyard Lab, Princeton Arts Council"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: 4-Hour Time Attestation */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Instructional Time Log
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                N.J.A.C. 6A:32-8.3 requires at least 4.0 hours of total structured activity.
              </p>
            </div>

            {/* Totalizer */}
            <div className={`p-4 rounded-xl border text-center ${
              totalHours >= 4.0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
            }`}>
              <div className="text-xs text-stone-500 font-semibold uppercase">Total Logged</div>
              <div className="text-2xl font-bold text-stone-900">{totalHours.toFixed(1)} Hours</div>
              <div className="text-xs text-emerald-700 font-medium mt-0.5">
                {totalHours >= 4.0 ? '✓ Minimum 4.0 Hours Met' : `Needs ${(4.0 - totalHours).toFixed(1)} more hours`}
              </div>
            </div>

            {/* Category Hours */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">📖 Literacy</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="6"
                  value={formData.hoursBreakdown.literacy}
                  onChange={(e) => updateHour('literacy', e.target.value)}
                  className="w-14 p-1 text-center font-bold border rounded bg-white"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🔬 STEM</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="6"
                  value={formData.hoursBreakdown.stem}
                  onChange={(e) => updateHour('stem', e.target.value)}
                  className="w-14 p-1 text-center font-bold border rounded bg-white"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🏛️ Community</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="6"
                  value={formData.hoursBreakdown.community}
                  onChange={(e) => updateHour('community', e.target.value)}
                  className="w-14 p-1 text-center font-bold border rounded bg-white"
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-700">🏃 Movement</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="6"
                  value={formData.hoursBreakdown.movement}
                  onChange={(e) => updateHour('movement', e.target.value)}
                  className="w-14 p-1 text-center font-bold border rounded bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Key Learnings with Generic Academic Topics of Study */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                What did you study today?
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Type or pick an academic topic of study below, and note what you explored.
              </p>
            </div>

            {/* Generic Academic Topics Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Topic of Study (Type or select from suggestions)
              </label>
              <input
                type="text"
                value={formData.subjectArea}
                onChange={(e) => {
                  updateField('subjectArea', e.target.value);
                  setTopicSearchOpen(true);
                }}
                onFocus={() => setTopicSearchOpen(true)}
                placeholder="e.g. Ecology, Biology, Physics, World History, Creative Writing, Astronomy..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#B05B3B]"
              />

              {/* Suggestions dropdown */}
              {topicSearchOpen && (
                <div className="mt-1 max-h-48 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 space-y-0.5 z-30">
                  <div className="text-[10px] font-bold uppercase text-stone-400 px-2 py-1 flex justify-between items-center">
                    <span>Topics of Study ({filteredTopics.length})</span>
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
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Key Discoveries & Concepts</label>
              <textarea
                rows="3"
                value={formData.keyLearnings}
                onChange={(e) => updateField('keyLearnings', e.target.value)}
                placeholder="What did you observe, calculate, test, read, or learn?"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Observations & Reflection with Tap-to-Fill Chips */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Observations & Reflection
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Kids can <strong>tap the chips below</strong> to auto-fill their observations, or type freely:
              </p>
            </div>

            {/* Sensory Tap-to-Fill Word Bank */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700">Sensory Observations</label>
                <span className="text-[11px] text-[#B05B3B] font-semibold">Tap chips to add ⤵</span>
              </div>

              {/* Kid-Friendly Tap Chips */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200 max-h-32 overflow-y-auto">
                {SENSORY_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSensoryChip(chip.text)}
                    className="inline-flex items-center gap-1 bg-white hover:bg-amber-50 hover:border-[#B05B3B] text-stone-700 hover:text-[#B05B3B] px-2.5 py-1 rounded-full border border-stone-200 text-[11px] font-medium shadow-2xs transition-all active:scale-95"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                rows="2"
                value={formData.sensoryObservations}
                onChange={(e) => updateField('sensoryObservations', e.target.value)}
                placeholder="Tap chips above or type what you saw, heard, or smelled..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>

            {/* Holistic Reflection Tap Prompts */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700">Holistic Reflection</label>
                <span className="text-[11px] text-[#B05B3B] font-semibold">Tap an idea ⤵</span>
              </div>

              {/* Reflection Idea Chips */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                {REFLECTION_CHIPS.slice(0, 4).map((refText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddReflectionChip(refText)}
                    className="text-left bg-white hover:bg-amber-50 hover:border-[#B05B3B] text-stone-700 hover:text-[#B05B3B] px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] font-medium transition-all active:scale-95"
                  >
                    {refText}
                  </button>
                ))}
              </div>

              <textarea
                rows="2"
                value={formData.holisticReflection}
                onChange={(e) => updateField('holisticReflection', e.target.value)}
                placeholder="How does this connect to nature, community, or real life?"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Sign & Submit */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Verification & Sign-Off
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Certify 4.0 hours of instructional activity under N.J.A.C. 6A:32-8.3.
              </p>
            </div>

            {/* Certification */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.certified}
                  onChange={(e) => updateField('certified', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#B05B3B]"
                />
                <span className="text-xs text-stone-800 leading-relaxed font-medium">
                  I certify that {formData.studentName} completed at least 4.0 hours of structured educational activity today under New Jersey state standards.
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
