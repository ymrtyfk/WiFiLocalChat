// Client-side Application: WiFi Local Chat

const socket = io();

// Localization Dictionaries
const translations = {
  ar: {
    langName: "English",
    loginTitle: "محادثة واي فاي المحلية",
    loginSubtitle: "تواصل مجاني بدون إنترنت مع الأجهزة القريبة",
    labelNickname: "الاسم المستعار / اللقب",
    nicknamePlaceholder: "مثال: أحمد",
    labelAvatar: "اختر صورتك الرمزية",
    btnEnter: "دخول المحادثة",
    headerTitle: "محادثة واي فاي المحلية",
    headerSubtitle: "متصل بالشبكة المحلية",
    btnInviteText: "دعوة أجهزة",
    appLangName: "English",
    sidebarTitle: "الغرف",
    btnCreateRoomText: "إنشاء غرفة جديدة",
    labelRoomSection: "الغرف المتاحة",
    activeRoomUsers: "متصل",
    typingText: "يكتب الآن...",
    messagePlaceholder: "اكتب رسالتك هنا...",
    recordingText: "جاري تسجيل ملاحظة صوتية...",
    cancelRecordBtn: "إلغاء",
    stopRecordBtn: "إيقاف وإرسال",
    inviteTitle: "الاتصال عبر الـ Wi-Fi",
    inviteSubtitle: "اجعل الأجهزة الأخرى على نفس شبكتك تتصل بالمسح",
    labelAddresses: "عناوين الاتصال المتاحة:",
    roomModalTitle: "إنشاء غرفة جديدة",
    roomModalSubtitle: "تواصل مع الآخرين في موضوع مخصص",
    labelRoomName: "اسم الغرفة",
    roomNamePlaceholder: "مثال: مطوري الويب",
    btnSubmitRoom: "إنشاء ودخول الغرفة",
    systemCreated: "نظام",
    generalRoomName: "العامة / General",
    joinedRoom: "انضم للمحادثة",
    leftRoom: "غادر المحادثة",
    uploadError: "فشل تحميل الملف. يرجى المحاولة مرة أخرى.",
    recordingError: "فشل بدء تسجيل الصوت. يرجى التحقق من أذونات الميكروفون.",
    anonymousUser: "مجهول"
  },
  en: {
    langName: "العربية",
    loginTitle: "Wi-Fi Local Chat",
    loginSubtitle: "Free offline communication with nearby devices",
    labelNickname: "Nickname / Alias",
    nicknamePlaceholder: "e.g., Alice",
    labelAvatar: "Choose your Avatar",
    btnEnter: "Enter Chat",
    headerTitle: "Wi-Fi Local Chat",
    headerSubtitle: "Connected to Local Network",
    btnInviteText: "Invite Devices",
    appLangName: "العربية",
    sidebarTitle: "Rooms",
    btnCreateRoomText: "Create New Room",
    labelRoomSection: "Available Rooms",
    activeRoomUsers: "online",
    typingText: "is typing...",
    messagePlaceholder: "Type your message here...",
    recordingText: "Recording voice note...",
    cancelRecordBtn: "Cancel",
    stopRecordBtn: "Stop & Send",
    inviteTitle: "Connect via Wi-Fi",
    inviteSubtitle: "Let other devices on the same network connect by scanning",
    labelAddresses: "Available Connection URLs:",
    roomModalTitle: "Create New Room",
    roomModalSubtitle: "Discuss a specific topic with others",
    labelRoomName: "Room Name",
    roomNamePlaceholder: "e.g., Web Developers",
    btnSubmitRoom: "Create & Join Room",
    systemCreated: "System",
    generalRoomName: "General Chat",
    joinedRoom: "joined the room",
    leftRoom: "left the room",
    uploadError: "File upload failed. Please try again.",
    recordingError: "Failed to start recording. Please check microphone permissions.",
    anonymousUser: "Anonymous"
  }
};

let currentLang = 'ar';

// Application State
let currentUser = {
  username: '',
  avatar: '🐱'
};
let activeRoomId = 'general';
let rooms = [];
let localIPs = [];
let localPort = 3000;

// Audio Recording variables
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname-input');
const avatarGrid = document.getElementById('avatar-grid');
const currentUserAvatar = document.getElementById('current-user-avatar');
const currentUserName = document.getElementById('current-user-name');

// Header elements
const headerTitle = document.getElementById('header-title');
const headerSubtitle = document.getElementById('header-subtitle');
const btnInviteText = document.getElementById('btn-invite-text');
const qrShareBtn = document.getElementById('qr-share-btn');
const langToggleBtn = document.getElementById('lang-toggle-btn');
const langToggleBtnLogin = document.getElementById('lang-toggle-btn-login');
const appLangName = document.getElementById('app-lang-name');
const loginLangName = document.getElementById('login-lang-name');

// Login form labels
const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');
const labelNickname = document.getElementById('label-nickname');
const labelAvatar = document.getElementById('label-avatar');
const btnEnter = document.getElementById('btn-enter');

// Sidebar Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnCreateRoomText = document.getElementById('btn-create-room-text');
const labelRoomSection = document.getElementById('label-room-section');
const roomsListContainer = document.getElementById('rooms-list-container');
const sidebarTitle = document.getElementById('sidebar-title');

// Chat elements
const activeRoomTitle = document.getElementById('active-room-title');
const activeRoomCreator = document.getElementById('active-room-creator');
const activeRoomUsers = document.getElementById('active-room-users');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const sendIcon = document.getElementById('send-icon');
const fileInput = document.getElementById('file-input');
const attachBtn = document.getElementById('attach-btn');
const recordBtn = document.getElementById('record-btn');

// Voice Banner elements
const recordingBanner = document.getElementById('recording-banner');
const recordingTextLabel = document.getElementById('recording-text');
const recordingTimer = document.getElementById('recording-timer');
const cancelRecordBtn = document.getElementById('cancel-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');

// Typing elements
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');

// Modals
const inviteModal = document.getElementById('invite-modal');
const inviteModalClose = document.getElementById('invite-modal-close');
const inviteTitleLabel = document.getElementById('invite-title');
const inviteSubtitleLabel = document.getElementById('invite-subtitle');
const labelAddresses = document.getElementById('label-addresses');
const ipsListContainer = document.getElementById('ips-list-container');

const roomModal = document.getElementById('room-modal');
const roomModalClose = document.getElementById('room-modal-close');
const roomModalTitle = document.getElementById('room-modal-title');
const roomModalSubtitle = document.getElementById('room-modal-subtitle');
const labelRoomName = document.getElementById('label-room-name');
const roomNameInput = document.getElementById('room-name-input');
const btnSubmitRoom = document.getElementById('btn-submit-room');

const imageModal = document.getElementById('image-modal');
const imageModalClose = document.getElementById('image-modal-close');
const imageModalImg = document.getElementById('image-modal-img');

// Available avatars mapping
const avatars = ['🐱', '🐶', '🦊', '🐻', '🦁', '🐯', '🐨', '🐼', '🐰', '🐸', '🦄', '🐝'];
let selectedAvatar = '🐱';

// Initialize Avatars in Login Grid
function initAvatars() {
  avatarGrid.innerHTML = '';
  avatars.forEach((avatar) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `text-3xl p-3 rounded-xl border-2 transition ${avatar === selectedAvatar ? 'border-indigo-600 bg-indigo-50 shadow-smScale' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`;
    btn.textContent = avatar;
    btn.addEventListener('click', () => {
      selectedAvatar = avatar;
      initAvatars();
    });
    avatarGrid.appendChild(btn);
  });
}

// Language Switcher Function
function switchLanguage(lang) {
  currentLang = lang;
  const rtl = lang === 'ar';
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  const dictionary = translations[lang];

  // Update dynamic language label text
  if (langToggleBtn) {
    appLangName.textContent = dictionary.langName;
  }
  if (langToggleBtnLogin) {
    loginLangName.textContent = dictionary.langName;
  }

  // Update Login Screen
  if (loginTitle) loginTitle.textContent = dictionary.loginTitle;
  if (loginSubtitle) loginSubtitle.textContent = dictionary.loginSubtitle;
  if (labelNickname) labelNickname.textContent = dictionary.labelNickname;
  if (nicknameInput) nicknameInput.placeholder = dictionary.nicknamePlaceholder;
  if (labelAvatar) labelAvatar.textContent = dictionary.labelAvatar;
  if (btnEnter) {
    btnEnter.innerHTML = `<span>${dictionary.btnEnter}</span> <i class="fa-solid ${rtl ? 'fa-arrow-left-to-bracket' : 'fa-arrow-right-to-bracket'}"></i>`;
  }

  // Update Header
  if (headerTitle) headerTitle.textContent = dictionary.headerTitle;
  if (headerSubtitle) headerSubtitle.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> ${dictionary.headerSubtitle}`;
  if (btnInviteText) btnInviteText.textContent = dictionary.btnInviteText;

  // Update Sidebar
  if (sidebarTitle) sidebarTitle.textContent = dictionary.sidebarTitle;
  if (btnCreateRoomText) btnCreateRoomText.textContent = dictionary.btnCreateRoomText;
  if (labelRoomSection) labelRoomSection.textContent = dictionary.labelRoomSection;

  // Update active room placeholder labels
  if (messageInput) messageInput.placeholder = dictionary.messagePlaceholder;
  if (recordingTextLabel) recordingTextLabel.textContent = dictionary.recordingText;
  if (cancelRecordBtn) cancelRecordBtn.innerHTML = `<i class="fa-solid fa-trash-can mr-1"></i> ${dictionary.cancelRecordBtn}`;
  if (stopRecordBtn) stopRecordBtn.innerHTML = `<i class="fa-solid fa-square mr-1"></i> ${dictionary.stopRecordBtn}`;

  // Update Modals
  if (inviteTitleLabel) inviteTitleLabel.textContent = dictionary.inviteTitle;
  if (inviteSubtitleLabel) inviteSubtitleLabel.textContent = dictionary.inviteSubtitle;
  if (labelAddresses) labelAddresses.textContent = dictionary.labelAddresses;

  if (roomModalTitle) roomModalTitle.textContent = dictionary.roomModalTitle;
  if (roomModalSubtitle) roomModalSubtitle.textContent = dictionary.roomModalSubtitle;
  if (labelRoomName) labelRoomName.textContent = dictionary.labelRoomName;
  if (roomNameInput) roomNameInput.placeholder = dictionary.roomNamePlaceholder;
  if (btnSubmitRoom) btnSubmitRoom.textContent = dictionary.btnSubmitRoom;

  // Flip Send Icon based on direction
  if (sendIcon) {
    if (rtl) {
      sendIcon.classList.add('rotate-180');
    } else {
      sendIcon.classList.remove('rotate-180');
    }
  }

  // Refresh dynamic UI components
  renderRooms();
}

// Fetch connection IP details from the server API
async function fetchServerInfo() {
  try {
    const res = await fetch('/api/info');
    const data = await res.json();
    localIPs = data.ips;
    localPort = data.port;
    renderIps();
    generateQRCode();
  } catch (err) {
    console.error('Failed to fetch server info:', err);
  }
}

// Render available connection URLs in Invite Modal
function renderIps() {
  ipsListContainer.innerHTML = '';
  localIPs.forEach(ip => {
    const url = `http://${ip}:${localPort}`;
    const div = document.createElement('div');
    div.className = "flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs";

    div.innerHTML = `
      <span class="font-mono text-indigo-700 select-all font-semibold break-all">${url}</span>
      <button class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-1.5 ml-2 transition hover:scale-105" onclick="navigator.clipboard.writeText('${url}'); alert('تم النسخ / Copied!')">
        <i class="fa-solid fa-copy"></i>
      </button>
    `;
    ipsListContainer.appendChild(div);
  });
}

// Generate QR Code for invite
function generateQRCode() {
  const qrCanvas = document.getElementById('qr-canvas');
  if (!qrCanvas) return;

  // Primary URL is first IP, or current window location host
  const primaryIP = localIPs[0] || window.location.hostname;
  const qrUrl = `http://${primaryIP}:${localPort}`;

  new QRious({
    element: qrCanvas,
    value: qrUrl,
    size: 180,
    background: '#ffffff',
    foreground: '#4f46e5', // Indigo-600
    level: 'H'
  });
}

// Setup Room Event Listeners & Rendering
function renderRooms() {
  roomsListContainer.innerHTML = '';
  const dictionary = translations[currentLang];

  rooms.forEach(room => {
    const isActive = room.id === activeRoomId;
    const btn = document.createElement('button');
    btn.className = `w-full text-right px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-2 text-sm ${isActive ? 'bg-indigo-600 text-white font-semibold shadow-md' : 'text-slate-600 hover:bg-slate-100'}`;

    // Room name handling
    const isSystem = room.isSystem;
    const name = isSystem ? dictionary.generalRoomName : room.name;
    const subtitle = isSystem ? dictionary.systemCreated : room.creator;

    btn.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}">
          <i class="fa-solid ${isSystem ? 'fa-globe' : 'fa-hashtag'}"></i>
        </div>
        <div class="truncate text-right">
          <div class="truncate font-medium">${name}</div>
          <div class="text-[9px] ${isActive ? 'text-indigo-200' : 'text-slate-400'} truncate">${dictionary.systemCreated}: ${subtitle}</div>
        </div>
      </div>
      <span class="text-[10px] ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'} px-1.5 py-0.5 rounded-full font-bold">
        ${room.userCount || 0}
      </span>
    `;

    btn.addEventListener('click', () => {
      if (activeRoomId !== room.id) {
        activeRoomId = room.id;
        socket.emit('join-room', room.id);
        renderRooms();

        // Mobile Sidebar Auto-Close
        sidebar.classList.add('translate-x-full');
        sidebarOverlay.classList.add('hidden');
      }
    });

    roomsListContainer.appendChild(btn);

    // Update active room header details if this is the active room
    if (isActive) {
      activeRoomTitle.textContent = name;
      activeRoomCreator.textContent = `${dictionary.systemCreated}: ${subtitle}`;
      activeRoomUsers.textContent = `${room.userCount || 1} ${dictionary.activeRoomUsers}`;
    }
  });
}

// Convert bytes to clean sizes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Escape HTML for security
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Render dynamic single messages
function renderMessage(msg) {
  const isSelf = msg.sender && msg.sender.id === socket.id;
  const dictionary = translations[currentLang];
  const div = document.createElement('div');

  if (msg.type === 'system') {
    div.className = "flex justify-center my-2 animate-fade-in";
    div.innerHTML = `
      <span class="bg-slate-100 border border-slate-200/50 text-[11px] text-slate-500 px-3.5 py-1 rounded-full text-center">
        ${escapeHTML(msg.text)}
      </span>
    `;
    messagesList.appendChild(div);
    scrollToBottom();
    return;
  }

  // Normal messages format
  div.className = `flex gap-2.5 max-w-full sm:max-w-xl ${isSelf ? 'justify-end ml-auto' : 'justify-start mr-auto'} animate-fade-in`;

  // Avatar block
  const avatarHtml = `<span class="text-2xl mt-1 select-none flex-shrink-0">${msg.sender.avatar || '🐱'}</span>`;

  // Message Bubble layout
  let contentHtml = '';
  if (msg.type === 'text') {
    contentHtml = `<p class="text-sm whitespace-pre-wrap break-words leading-relaxed">${escapeHTML(msg.text)}</p>`;
  } else if (msg.type === 'image') {
    contentHtml = `
      <div class="space-y-1">
        <img class="max-w-full sm:max-w-sm rounded-lg shadow-sm cursor-zoom-in hover:opacity-95 transition"
          src="${msg.fileUrl}" alt="Image attachment" onclick="zoomImage('${msg.fileUrl}')">
        ${msg.text ? `<p class="text-xs mt-1 whitespace-pre-wrap break-words">${escapeHTML(msg.text)}</p>` : ''}
      </div>
    `;
  } else if (msg.type === 'file') {
    const meta = msg.fileMetadata || {};
    contentHtml = `
      <div class="flex items-center gap-3 bg-white/20 border border-white/10 rounded-xl p-2.5 text-xs">
        <div class="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center text-lg text-white">
          <i class="fa-solid fa-file-invoice"></i>
        </div>
        <div class="flex-1 overflow-hidden">
          <div class="font-bold truncate max-w-[150px] sm:max-w-[200px]" title="${escapeHTML(meta.name)}">${escapeHTML(meta.name)}</div>
          <div class="opacity-75 text-[10px] mt-0.5">${formatBytes(meta.size)}</div>
        </div>
        <a href="${msg.fileUrl}" download="${escapeHTML(meta.name)}"
          class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition">
          <i class="fa-solid fa-download"></i>
        </a>
      </div>
      ${msg.text ? `<p class="text-xs mt-1 whitespace-pre-wrap break-words">${escapeHTML(msg.text)}</p>` : ''}
    `;
  } else if (msg.type === 'voice') {
    contentHtml = `
      <div class="space-y-1 min-w-[200px]">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-play text-indigo-200 text-xl animate-pulse"></i>
          <span class="text-xs font-semibold">ملاحظة صوتية / Voice Note</span>
        </div>
        <audio controls src="${msg.fileUrl}" class="w-full h-8 mt-1.5 rounded-lg focus:outline-none"></audio>
      </div>
    `;
  }

  // Sender details + Bubble wrapper
  const alignmentClass = isSelf ? 'items-end' : 'items-start';
  const bubbleThemeClass = isSelf ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none';
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubbleHtml = `
    <div class="flex flex-col ${alignmentClass} max-w-full">
      <div class="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-400 select-none">
        <span>${escapeHTML(msg.sender.username)}</span>
        <span>•</span>
        <span>${time}</span>
      </div>
      <div class="px-4 py-3 rounded-2xl shadow-sm ${bubbleThemeClass} max-w-full">
        ${contentHtml}
      </div>
    </div>
  `;

  if (isSelf) {
    div.innerHTML = bubbleHtml + avatarHtml;
  } else {
    div.innerHTML = avatarHtml + bubbleHtml;
  }

  messagesList.appendChild(div);
  scrollToBottom();
}

// Auto-Scroll helper with nice smooth behavior
function scrollToBottom() {
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 50);
}

// Image Zoom Handler
function zoomImage(url) {
  imageModalImg.src = url;
  imageModal.classList.remove('hidden');
}

// Form Handlers & Submission events
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nicknameInput.value.trim();
  if (!name) return;

  currentUser.username = name;
  currentUser.avatar = selectedAvatar;

  currentUserAvatar.textContent = selectedAvatar;
  currentUserName.textContent = name;

  // Socket Register User
  socket.emit('register-user', {
    username: name,
    avatar: selectedAvatar
  });

  // Switch Rooms to General by Default
  socket.emit('join-room', activeRoomId);

  // Transition UI screens
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  fetchServerInfo();
});

// Send Message action
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('send-message', {
    type: 'text',
    text: text
  });

  messageInput.value = '';
  socket.emit('stop-typing');
});

// Attach File logic
attachBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Verify file upload logic
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error();

    const data = await res.json();
    const isImage = file.type.startsWith('image/');

    socket.emit('send-message', {
      type: isImage ? 'image' : 'file',
      fileUrl: data.url,
      fileMetadata: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (err) {
    alert(translations[currentLang].uploadError);
  } finally {
    fileInput.value = ''; // Reset input element
  }
});

// Voice Notes Audio Recording Logic
recordBtn.addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    return; // Already recording
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', audioFile);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error();

        const data = await res.json();
        socket.emit('send-message', {
          type: 'voice',
          fileUrl: data.url
        });
      } catch (err) {
        alert(translations[currentLang].uploadError);
      }

      // Stop all tracks to release mic hardware
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();

    // Start timer GUI
    recordingSeconds = 0;
    recordingTimer.textContent = '00:00';
    recordingBanner.classList.remove('hidden');

    clearInterval(recordingInterval);
    recordingInterval = setInterval(() => {
      recordingSeconds++;
      const m = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
      const s = (recordingSeconds % 60).toString().padStart(2, '0');
      recordingTimer.textContent = `${m}:${s}`;
    }, 1000);

  } catch (err) {
    alert(translations[currentLang].recordingError);
  }
});

cancelRecordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    // Override onstop so we don't upload or send the cancelled blob
    mediaRecorder.onstop = () => {
      // Re-release tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.stop();
  }
  clearInterval(recordingInterval);
  recordingBanner.classList.add('hidden');
});

stopRecordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  clearInterval(recordingInterval);
  recordingBanner.classList.add('hidden');
});

// Real-time Typing Indicators
let typingTimeout = null;
messageInput.addEventListener('keyup', () => {
  socket.emit('typing');

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 2000);
});

messageInput.addEventListener('blur', () => {
  socket.emit('stop-typing');
});

// Rooms Management
btnCreateRoom.addEventListener('click', () => {
  roomModal.classList.remove('hidden');
});

roomModalClose.addEventListener('click', () => {
  roomModal.classList.add('hidden');
});

document.getElementById('create-room-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const roomName = roomNameInput.value.trim();
  if (!roomName) return;

  socket.emit('create-room', { roomName });
  roomModal.classList.add('hidden');
  roomNameInput.value = '';
});

// Modals toggling
qrShareBtn.addEventListener('click', () => {
  inviteModal.classList.remove('hidden');
});

inviteModalClose.addEventListener('click', () => {
  inviteModal.classList.add('hidden');
});

imageModalClose.addEventListener('click', () => {
  imageModal.classList.add('hidden');
});

// Mobile Sidebar Interactions
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.remove('translate-x-full');
  sidebarOverlay.classList.remove('hidden');
});

sidebarClose.addEventListener('click', () => {
  sidebar.classList.add('translate-x-full');
  sidebarOverlay.classList.add('hidden');
});

sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.add('translate-x-full');
  sidebarOverlay.classList.add('hidden');
});

// Language switching button bindings
langToggleBtn.addEventListener('click', () => {
  const nextLang = currentLang === 'ar' ? 'en' : 'ar';
  switchLanguage(nextLang);
});

langToggleBtnLogin.addEventListener('click', () => {
  const nextLang = currentLang === 'ar' ? 'en' : 'ar';
  switchLanguage(nextLang);
});

// Socket Event Receivers
socket.on('room-list', (activeRooms) => {
  rooms = activeRooms;
  renderRooms();
});

socket.on('room-created', (newRoomId) => {
  activeRoomId = newRoomId;
  socket.emit('join-room', newRoomId);
});

socket.on('message-history', (history) => {
  messagesList.innerHTML = '';
  history.forEach(msg => renderMessage(msg));
});

socket.on('message', (msg) => {
  renderMessage(msg);
});

socket.on('user-typing', (data) => {
  const dictionary = translations[currentLang];
  typingText.textContent = `${escapeHTML(data.username)} ${dictionary.typingText}`;
  typingIndicator.classList.remove('hidden');
});

socket.on('user-stop-typing', (data) => {
  typingIndicator.classList.add('hidden');
});

// Initial Setup execution
initAvatars();
switchLanguage('ar'); // Default to Arabic RTL
