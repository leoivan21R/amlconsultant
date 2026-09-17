/**
 * AML Consultant LLC — Executive Frontend Engine
 * Handles bilingual switching (EN/ES), stat counters, interactive modals,
 * and service diagnostic form synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Bilingual Translation Engine (English & Spanish)
  // --------------------------------------------------------------------------
  const translations = {
    en: {
      nav_services: "Services",
      nav_systems: "Systems",
      nav_founder: "Leadership",
      nav_clients: "Clients",
      nav_elearning: "E-Learning",
      nav_contact: "Contact",
      btn_audit: "Schedule Audit",
      
      hero_badge: "SECURE YOUR INSTITUTION // BSA & AML REGULATORY ADVISORY",
      hero_title_1: "Regulatory Certainty &",
      hero_title_gold: "Financial Crime Defense",
      hero_title_2: "for Modern Institutions",
      hero_desc: "Led by Leo I. Rivera, CFE, CAMS, CAFCA. Over 24 years providing specialized BSA/AML advisory, independent 5-pillars testing, core banking & surveillance system implementation, and regulatory examination defense across Puerto Rico and the United States.",
      hero_btn_primary: "Request Risk Diagnostic",
      hero_btn_secondary: "Explore E-Learning Suite",
      
      card_lead_title: "Active BSA Officer & Auditor",
      card_role: "Lead Regulatory Consultant",
      card_sub: "Financial Institutions in PR & USA",
      card_matrix_label: "Selected Banking & Surveillance Cores",
      
      metric_exp: "Years AML/BSA Experience",
      metric_certs: "Elite Master Certifications",
      metric_systems: "Banking & Surveillance Cores",
      metric_rating: "Independent Audit Integrity",

      trust_label: "TRUSTED BY LEADING FINANCIAL INSTITUTIONS, FINTECHS & COOPERATIVAS",

      services_badge: "CORE PRACTICE AREAS",
      services_title: "Four Pillars of Regulatory & Technical Excellence",
      services_subtitle: "End-to-end advisory engineered to mitigate compliance exposure, satisfy regulatory consent orders, and optimize surveillance technology.",

      s1_title: "BSA / AML & OFAC Compliance Advisory",
      s1_desc: "Full-lifecycle compliance consulting for commercial banks, international financial entities (IFE), credit unions, and fintechs. Certified CFE, CAMS, and CAFCA leadership.",
      s1_f1: "Custom BSA/AML & OFAC Risk Assessments",
      s1_f2: "Policies, Procedures & Customer Acceptance Models",
      s1_f3: "FinCEN, SARs & CIP Framework Structuring",
      s1_cta: "Consult on AML Advisory →",

      s2_title: "Core Banking & Surveillance Implementation",
      s2_desc: "Serving as Information Systems Officer (ISO). Comprehensive deployment, scenario tuning, and validation for leading AML surveillance and core banking infrastructures.",
      s2_f1: "Bridger Insight XG, Global Radar & Fiserv AML",
      s2_f2: "Core Banking: Mambu, MeridianLink & Veritran",
      s2_f3: "Database Architecture: MySQL, Access & Pronto Forms",
      s2_cta: "Inquire about Systems →",

      s3_title: "Independent BSA Audits & Field KYC Visits",
      s3_desc: "Rigorous independent testing across the BSA 5 Pillars. Enhanced Due Diligence (EDD) site inspections and technological validation of transaction monitoring models.",
      s3_f1: "Independent Annual BSA / AML 5-Pillar Audits",
      s3_f2: "On-site Client Visits & Field EDD via Pronto Forms",
      s3_f3: "Independent Validation of Surveillance Logic & Rules",
      s3_cta: "Schedule an Audit →",

      s4_title: "Interactive E-Learning & Training Modules",
      s4_desc: "Tailor-made e-learning programs designed with Adobe Captivate and SCORM-compliant LMS architectures to certify employees, analysts, and Boards of Directors.",
      s4_f1: "Customized Video, Interactive Scenarios & Knowledge Checks",
      s4_f2: "Pre-employment BSA Officer & Analyst Benchmark Exams",
      s4_f3: "Executive Board Compliance Briefings & LMS Tracking",
      s4_cta: "Access Training Suite →",

      founder_badge: "PRINCIPAL CONSULTANT",
      founder_title: "24+ Years of Dedicated Financial Crime Prevention",
      founder_p1: "Founded by Leo I. Rivera in 2020, AML Consultant LLC represents the culmination of more than two decades at the forefront of the Bank Secrecy Act and Anti-Money Laundering operations in Puerto Rico and the continental United States.",
      founder_p2: "Leo currently serves as the designated BSA Officer for multiple banking institutions. His dual mastery in regulatory law compliance and information technology infrastructure bridges the critical gap between executive board obligations and technical surveillance operations.",
      founder_systems_label: "SPECIALIZED SURVEILLANCE & AML TECH STACK",

      elearn_badge: "EDUCATIONAL EXCELLENCE",
      elearn_title: "Interactive E-Learning & Pre-Hire Evaluations",
      elearn_subtitle: "Experience our simulated training modules. Designed to ensure verifiable knowledge retention and automated LMS tracking for regulatory examiners.",
      
      c1_tag: "Interactive Course",
      c1_title: "Customer Due Diligence (CDD) Basic Training",
      c1_desc: "Interactive curriculum covering beneficial ownership, customer risk profiling, and document verification through simulated banking systems.",
      c1_btn: "Launch Course Preview",

      c2_tag: "Assessment Exam",
      c2_title: "BSA Officer & Compliance Analyst Exam",
      c2_desc: "Rigorous benchmark exam used by financial institutions to assess candidate technical knowledge prior to hiring or promotion.",
      c2_btn: "Access Assessment Demo",

      c3_tag: "Regulatory Test",
      c3_title: "OFAC Sanctions & Compliance Evaluation",
      c3_desc: "Targeted examination measuring organizational readiness regarding Specially Designated Nationals (SDNs), trade sanctions, and blocking protocols.",
      c3_btn: "Take OFAC Evaluation",

      lms_banner_title: "Need Custom SCORM Modules for Your Organization?",
      lms_banner_desc: "We develop branded training packages compatible with your existing LMS (Cornerstone, Moodle, Cloud SCORM) with real-time employee tracking.",
      lms_banner_btn: "Request Custom Curriculum",

      contact_badge: "INITIATE AUDIT OR CONSULTATION",
      contact_title: "Let's Strengthen Your Institutional Shield",
      contact_desc: "Contact us for a confidential initial review of your AML program, upcoming regulatory examination, or surveillance technology validation.",
      contact_phone_label: "Direct Phone",
      contact_location_label: "Headquarters",
      contact_guarantee: "Strict Institutional Confidentiality: All inquiries and shared documentation are protected under professional consulting non-disclosure agreements.",

      form_title: "Request Diagnostic or Consultation",
      form_subtitle: "Complete this form and our Principal Consultant will respond within 24 business hours.",
      form_name_label: "Full Name",
      form_email_label: "Corporate Email Address",
      form_phone_label: "Phone Number",
      form_type_label: "Institution Type",
      form_type_opt_bank: "Commercial / International Bank (IFE/EBI)",
      form_type_opt_fintech: "Fintech / Neobank / Payment Processor",
      form_type_opt_coop: "Credit Union / Cooperativa Financiera",
      form_type_opt_msb: "Money Services Business (MSB)",
      form_type_opt_other: "Other Entity / Non-Financial",
      form_service_label: "Primary Service Required",
      form_service_opt_audit: "BSA/AML Independent Audit (5 Pillars)",
      form_service_opt_sys: "Core / Surveillance System Implementation",
      form_service_opt_edd: "KYC Site Visits & Field EDD",
      form_service_opt_train: "E-Learning & Staff / Board Training",
      form_service_opt_all: "Comprehensive Full-Program Retainer",
      form_msg_label: "Specific Objectives or Examination Deadlines",
      form_msg_placeholder: "Describe your institution's timeline, systems in use, or upcoming examination requirements...",
      form_submit_btn: "Submit Diagnostic Request",
      
      footer_desc: "Premier Anti-Money Laundering, Bank Secrecy Act, and financial crimes technology advisory. Providing institutional certainty and regulatory defense.",
      footer_links_title: "Navigation",
      footer_services_title: "Specialties",
      footer_legal_title: "Direct Access",
      footer_copyright: "© 2026 AML Consultant LLC. All Rights Reserved. Leo I. Rivera, CFE, CAMS, CAFCA."
    },
    es: {
      nav_services: "Servicios",
      nav_systems: "Sistemas",
      nav_founder: "Liderazgo",
      nav_clients: "Clientes",
      nav_elearning: "E-Learning",
      nav_contact: "Contacto",
      btn_audit: "Agendar Auditoría",
      
      hero_badge: "PROTEJA SU INSTITUCIÓN // ASESORÍA REGULATORIA BSA & AML",
      hero_title_1: "Certeza Regulatoria y",
      hero_title_gold: "Defensa Antilavado",
      hero_title_2: "para Instituciones Modernas",
      hero_desc: "Liderado por Leo I. Rivera, CFE, CAMS, CAFCA. Más de 24 años brindando asesoría especializada en BSA/AML, auditorías independientes de los 5 pilares, implementación de sistemas bancarios y de vigilancia, y preparación ante exámenes regulatorios en Puerto Rico y Estados Unidos.",
      hero_btn_primary: "Solicitar Diagnóstico de Riesgo",
      hero_btn_secondary: "Explorar Suite E-Learning",
      
      card_lead_title: "Oficial BSA y Auditor Activo",
      card_role: "Consultor Regulatorio Principal",
      card_sub: "Instituciones Financieras en PR y EE. UU.",
      card_matrix_label: "Sistemas Bancarios y de Vigilancia",
      
      metric_exp: "Años de Experiencia AML/BSA",
      metric_certs: "Certificaciones de Élite",
      metric_systems: "Cores y Sistemas Dominados",
      metric_rating: "Integridad en Auditorías",

      trust_label: "CONFIADO POR INSTITUCIONES FINANCIERAS LÍDERES, FINTECHS Y COOPERATIVAS",

      services_badge: "ÁREAS DE PRÁCTICA",
      services_title: "Cuatro Pilares de Excelencia Regulatoria y Tecnológica",
      services_subtitle: "Asesoría integral diseñada para mitigar el riesgo de incumplimiento, satisfacer requerimientos regulatorios y optimizar la tecnología de monitoreo.",

      s1_title: "Asesoría en Cumplimiento BSA / AML y OFAC",
      s1_desc: "Consultoría de ciclo completo para bancos comerciales, entidades financieras internacionales (IFE/EBI), cooperativas y fintechs. Liderazgo certificado CFE, CAMS y CAFCA.",
      s1_f1: "Evaluaciones de Riesgo BSA/AML y Sanciones OFAC",
      s1_f2: "Políticas, Procedimientos y Modelos de Aceptación",
      s1_f3: "Estructuración de SARs, CIP y Reportes FinCEN",
      s1_cta: "Consultar sobre Asesoría AML →",

      s2_title: "Implementación de Sistemas Bancarios y Vigilancia",
      s2_desc: "Rol como Oficial de Sistemas de Información (ISO). Despliegue, parametrización de escenarios y validación de tecnologías líderes de monitoreo transaccional y core banking.",
      s2_f1: "Bridger Insight XG, Global Radar y Fiserv AML",
      s2_f2: "Cores Bancarios: Mambu, MeridianLink y Veritran",
      s2_f3: "Bases de Datos: MySQL, Access y Formularios Pronto Forms",
      s2_cta: "Consultar sobre Sistemas →",

      s3_title: "Auditorías Independientes BSA y Visitas KYC / EDD",
      s3_desc: "Pruebas independientes rigurosas de los 5 Pilares de la Ley BSA. Inspecciones presenciales de Due Diligence Mejorado (EDD) y validación técnica de reglas de vigilancia.",
      s3_f1: "Auditorías Anuales Independientes de los 5 Pilares",
      s3_f2: "Visitas Presenciales e Inspección EDD con Pronto Forms",
      s3_f3: "Validación Técnica Independiente de Algoritmos",
      s3_cta: "Agendar una Auditoría →",

      s4_title: "Módulos Interactivos de E-Learning y Capacitación",
      s4_desc: "Programas de capacitación a medida desarrollados con Adobe Captivate y plataformas LMS con estándar SCORM para certificar empleados, analistas y Juntas Directivas.",
      s4_f1: "Videos, Escenarios Interactivos y Validación de Conocimiento",
      s4_f2: "Exámenes de Evaluación para Contratación de Oficiales BSA",
      s4_f3: "Capacitaciones para Junta Directiva y Reportes LMS",
      s4_cta: "Acceder a la Suite de Capacitación →",

      founder_badge: "CONSULTOR PRINCIPAL",
      founder_title: "Más de 24 Años de Trayectoria en Prevención de Delitos Financieros",
      founder_p1: "Fundada por Leo I. Rivera en el 2020, AML Consultant LLC representa la culminación de más de dos décadas de liderazgo operativo en la Ley de Secreto Bancario (BSA) y Antilavado de Dinero (AML) en Puerto Rico y Estados Unidos.",
      founder_p2: "Leo se desempeña actualmente como Oficial BSA para múltiples instituciones bancarias. Su doble dominio en cumplimiento normativo e infraestructura tecnológica conecta las obligaciones de la Junta con los sistemas de monitoreo transaccional.",
      founder_systems_label: "STACK TECNOLÓGICO Y DE MONITOREO ESPECIALIZADO",

      elearn_badge: "EXCELENCIA EDUCATIVA",
      elearn_title: "E-Learning Interactivo y Evaluaciones Pre-Empleo",
      elearn_subtitle: "Conozca nuestras demostraciones interactivas. Diseñadas para garantizar aprendizaje medible y trazabilidad automatizada ante los examinadores regulatorios.",
      
      c1_tag: "Curso Interactivo",
      c1_title: "Entrenamiento Básico de Debida Diligencia (CDD)",
      c1_desc: "Capacitación interactiva que cubre beneficiario final, perfil de riesgo del cliente y verificación documental mediante simulaciones de sistemas.",
      c1_btn: "Iniciar Vista Previa",

      c2_tag: "Examen Evaluativo",
      c2_title: "Examen de Admisión para Oficial / Analista BSA",
      c2_desc: "Examen de referencia utilizado por instituciones financieras para validar el conocimiento técnico de candidatos antes de su contratación.",
      c2_btn: "Acceder a Demo de Examen",

      c3_tag: "Prueba Regulatoria",
      c3_title: "Evaluación de Regulaciones y Sanciones OFAC",
      c3_desc: "Evaluación enfocada en medir la preparación del personal sobre personas bloqueadas (SDN), regímenes de sanciones y congelamiento de activos.",
      c3_btn: "Tomar Evaluación OFAC",

      lms_banner_title: "¿Requiere Módulos SCORM a la Medida de su Institución?",
      lms_banner_desc: "Desarrollamos paquetes de formación corporativa compatibles con su LMS (Cornerstone, Moodle, Cloud SCORM) con trazabilidad en tiempo real.",
      lms_banner_btn: "Solicitar Currículo Personalizado",

      contact_badge: "INICIE SU CONSULTA O AUDITORÍA",
      contact_title: "Fortalezcamos el Escudo Regulatorio de su Institución",
      contact_desc: "Contáctenos para una revisión inicial confidencial de su programa AML, preparación para inspección regulatoria o validación de sistemas de monitoreo.",
      contact_phone_label: "Teléfono Directo",
      contact_location_label: "Sede Principal",
      contact_guarantee: "Estricta Confidencialidad Institucional: Todas las comunicaciones y documentos compartidos están protegidos por acuerdos de no divulgación profesional.",

      form_title: "Solicitar Diagnóstico o Consulta",
      form_subtitle: "Complete el formulario y nuestro Consultor Principal le responderá en menos de 24 horas hábiles.",
      form_name_label: "Nombre y Apellidos",
      form_email_label: "Correo Electrónico Corporativo",
      form_phone_label: "Teléfono de Contacto",
      form_type_label: "Tipo de Institución",
      form_type_opt_bank: "Banco Comercial / Internacional (IFE/EBI)",
      form_type_opt_fintech: "Fintech / Neobanco / Procesador de Pagos",
      form_type_opt_coop: "Cooperativa Financiera / Credit Union",
      form_type_opt_msb: "Empresa de Servicios Monetarios (MSB)",
      form_type_opt_other: "Otra Entidad / No Financiera",
      form_service_label: "Servicio Principal Requerido",
      form_service_opt_audit: "Auditoría Independiente BSA/AML (5 Pilares)",
      form_service_opt_sys: "Implementación de Core / Sistema de Monitoreo",
      form_service_opt_edd: "Visitas KYC Presenciales e Inspección EDD",
      form_service_opt_train: "E-Learning y Capacitación de Personal / Junta",
      form_service_opt_all: "Retenedor Integral de Cumplimiento",
      form_msg_label: "Objetivos Específicos o Plazo Regulatorio",
      form_msg_placeholder: "Describa el cronograma de su institución, sistemas en uso o requisitos de su próxima auditoría...",
      form_submit_btn: "Enviar Solicitud de Diagnóstico",
      
      footer_desc: "Asesoría de primer nivel en Antilavado de Dinero (AML), Ley Secrecy Act (BSA) y tecnología para la prevención de delitos financieros.",
      footer_links_title: "Navegación",
      footer_services_title: "Especialidades",
      footer_legal_title: "Acceso Rápido",
      footer_copyright: "© 2026 AML Consultant LLC. Todos los derechos reservados. Leo I. Rivera, CFE, CAMS, CAFCA."
    }
  };

  let currentLang = localStorage.getItem('aml_lang') || 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('aml_lang', lang);
    document.documentElement.lang = lang;

    // Update active button classes
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all text nodes with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute('placeholder', translations[lang][key]);
      }
    });
  }

  // Setup language button listeners
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang);
    });
  });

  // Apply default on initial load
  applyLanguage(currentLang);

  // --------------------------------------------------------------------------
  // 2. Sticky Navbar & Header Blur
  // --------------------------------------------------------------------------
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // --------------------------------------------------------------------------
  // 3. Smooth Animated Stat Counters
  // --------------------------------------------------------------------------
  let countersStarted = false;
  const metricsSection = document.getElementById('metrics-strip');

  function animateCounters() {
    const counters = document.querySelectorAll('.counter-val');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const duration = 1800;
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = Math.floor(ease * target);
        counter.textContent = currentVal;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  if (metricsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          animateCounters();
        }
      });
    }, { threshold: 0.2 });

    observer.observe(metricsSection);
  }

  // --------------------------------------------------------------------------
  // 4. Interactive Pre-filling for Contact Form
  // --------------------------------------------------------------------------
  document.querySelectorAll('[data-select-service]').forEach(cta => {
    cta.addEventListener('click', (e) => {
      const serviceVal = cta.getAttribute('data-select-service');
      const selectElem = document.getElementById('service-select');
      if (selectElem && serviceVal) {
        selectElem.value = serviceVal;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Interactive Modal Viewer (E-Learning / Certifications)
  // --------------------------------------------------------------------------
  const modalOverlay = document.getElementById('interactive-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const modalActionBtn = document.getElementById('modal-action-btn');

  function openModal(title, content, actionUrl, actionText) {
    if (!modalOverlay) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    if (actionUrl) {
      modalActionBtn.style.display = 'inline-flex';
      modalActionBtn.href = actionUrl;
      modalActionBtn.textContent = actionText || (currentLang === 'es' ? 'Acceder al Módulo' : 'Launch Module');
    } else {
      modalActionBtn.style.display = 'none';
    }
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Modal triggers for E-Learning demos
  const courseDetails = {
    cdd: {
      en: {
        title: "Customer Due Diligence (CDD) Basic Training",
        content: "<p>This interactive course provides practical simulation modules for bank personnel, compliance analysts, and front-line staff. It instructs participants on identifying Ultimate Beneficial Ownership (UBO), applying FinCEN CDD Rule pillars, evaluating customer risk profiles, and properly completing internal onboarding records.</p><p style='margin-top:1rem;'><strong>Module Architecture:</strong> SCORM 1.2 / 2004 compatible, simulated workflow quizzes, video guides, and automated pass/fail verification.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=ed62ba1a-1006-4f99-bd3d-f198c043894c",
        btn: "Open Cloud SCORM Demo"
      },
      es: {
        title: "Entrenamiento Básico de Debida Diligencia (CDD)",
        content: "<p>Este curso interactivo proporciona módulos de simulación práctica para personal bancario, analistas de cumplimiento y oficiales de primera línea. Enseña la identificación del Beneficiario Final (UBO), la regla CDD de FinCEN, perfiles de riesgo y llenado de formularios internos.</p><p style='margin-top:1rem;'><strong>Arquitectura:</strong> Compatible con SCORM 1.2 / 2004, exámenes interactivos, videos instructivos y validación automática para auditorías.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=ed62ba1a-1006-4f99-bd3d-f198c043894c",
        btn: "Abrir Demostración en Cloud SCORM"
      }
    },
    bsa_exam: {
      en: {
        title: "BSA Officer & Analyst Benchmark Examination",
        content: "<p>A comprehensive technical evaluation used by hiring managers, directors, and search committees to objectively benchmark a candidate's mastery of the Bank Secrecy Act before extending employment offers.</p><p style='margin-top:1rem;'><strong>Evaluated Competencies:</strong> Suspicious Activity Reporting (SAR) red flags, Currency Transaction Reports (CTR), OFAC screening lists, 314(a) & 314(b) information sharing, and regulatory enforcement cases.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=6ed97d14-2fcc-46e6-a664-4417360d5302",
        btn: "Access BSA Exam Portal"
      },
      es: {
        title: "Examen de Admisión para Oficial y Analista BSA",
        content: "<p>Evaluación técnica completa utilizada por directores y comités de contratación para medir con precisión objetiva los conocimientos de la Ley BSA en candidatos a posiciones de cumplimiento.</p><p style='margin-top:1rem;'><strong>Competencias Evaluadas:</strong> Señales de alerta para Reportes de Actividad Sospechosa (SAR), CTRs, listas OFAC, intercambio de información 314(a)/314(b) y jurisprudencia regulatoria.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=6ed97d14-2fcc-46e6-a664-4417360d5302",
        btn: "Acceder al Portal del Examen"
      }
    },
    ofac: {
      en: {
        title: "OFAC Sanctions & Regulations Compliance Test",
        content: "<p>Testing readiness on the Office of Foreign Assets Control (OFAC) regulations. Crucial for financial entities processing international wires, letters of credit, and cross-border payment settlements.</p><p style='margin-top:1rem;'><strong>Focus Topics:</strong> Specially Designated Nationals (SDN) lists, sectoral sanctions, unblocking procedures, and mandatory reporting protocols to the US Treasury.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=ed62ba1a-1006-4f99-bd3d-f198c043894c",
        btn: "Open OFAC Evaluation"
      },
      es: {
        title: "Evaluación de Regulaciones y Sanciones OFAC",
        content: "<p>Evaluación especializada sobre las normativas de la Oficina de Control de Activos Extranjeros (OFAC). Indispensable para entidades que procesan transferencias internacionales y pagos transfronterizos.</p><p style='margin-top:1rem;'><strong>Temas de Evaluación:</strong> Listas SDN, sanciones sectoriales, procedimientos de bloqueo/desbloqueo y reportes mandatorios ante el Departamento del Tesoro de EE. UU.</p>",
        url: "https://app.cloud.scorm.com/sc/InvitationConfirmEmail?publicInvitationId=ed62ba1a-1006-4f99-bd3d-f198c043894c",
        btn: "Abrir Evaluación OFAC"
      }
    }
  };

  document.querySelectorAll('[data-course-key]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-course-key');
      if (courseDetails[key]) {
        const item = courseDetails[key][currentLang];
        openModal(item.title, item.content, item.url, item.btn);
      }
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinksContainer = document.querySelector('.nav-links');
  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinksContainer.style.display === 'flex';
      navLinksContainer.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinksContainer.style.flexDirection = 'column';
        navLinksContainer.style.position = 'absolute';
        navLinksContainer.style.top = '100%';
        navLinksContainer.style.left = '0';
        navLinksContainer.style.width = '100%';
        navLinksContainer.style.background = 'var(--bg-surface)';
        navLinksContainer.style.padding = '1.5rem';
        navLinksContainer.style.borderBottom = '1px solid var(--border-subtle)';
      }
    });

    // Close mobile menu when clicking any nav-link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinksContainer.style.display = 'none';
        }
      });
    });
  }
});
