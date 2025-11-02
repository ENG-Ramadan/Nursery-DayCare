// تخزين البيانات
const STORAGE_KEY = 'nursery_kids_advanced';

const defaultKids = [
  { id: '1', childName: "عمر خالد", parentName: "خالد محمود", phone: "01012345678", receiver: "سارة محمد", entry: "08:15", left: false },
  { id: '2', childName: "ليلى أحمد", parentName: "أحمد سمير", phone: "01098765432", receiver: "مروى علي", entry: "09:00", left: false },
  { id: '3', childName: "ياسمين وليد", parentName: "وليد حسن", phone: "01055556666", receiver: "منى أحمد", entry: "07:45", left: true, exit: "14:30", duration: "6 ساعات 45 دقيقة" }
];

function loadKids() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultKids));
    return defaultKids;
  }
  return JSON.parse(saved);
}

function saveKids(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

let kids = loadKids();

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const btnAdd = document.getElementById('btnAdd');
const btnExport = document.getElementById('btnExport');
const btnImport = document.getElementById('btnImport');

function updateStats() {
  document.getElementById('totalChildren').textContent = kids.length;
  document.getElementById('presentChildren').textContent = kids.filter(k => !k.left).length;
  document.getElementById('leftChildren').textContent = kids.filter(k => k.left).length;
}

function renderTable(filter = '') {
  const f = filter.toLowerCase();
  const list = kids.filter(k =>
    !f ||
    k.childName.toLowerCase().includes(f) ||
    k.parentName.toLowerCase().includes(f) ||
    k.phone.includes(f) ||
    k.receiver.toLowerCase().includes(f)
  );

  tableBody.innerHTML = '';
  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#a0aec0;">لا توجد نتائج</td></tr>`;
    updateStats();
    return;
  }

  list.forEach(kid => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${kid.childName}</td>
      <td>${kid.parentName}</td>
      <td dir="ltr">${kid.phone}</td>
      <td>${kid.receiver}</td>
      <td>${kid.entry}</td>
      <td><span class="status-badge ${kid.left ? 'status-left' : 'status-present'}">${kid.left ? 'تمت المغادرة' : 'موجود'}</span></td>
      <td>${kid.left ? '-' : `<button class="btn-action btn-checkout" data-id="${kid.id}">تسجيل مغادرة</button>`}</td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll('.btn-checkout').forEach(b => {
    b.onclick = e => openCheckoutModal(e.target.dataset.id);
  });

  updateStats();
}

btnAdd.onclick = () => {
  openModal(`
    <div class="modal-header"><h3>إضافة طفل جديد</h3></div>
    <div class="form-grid">
      <div><label>اسم الطفل</label><input id="childName" type="text" /></div>
      <div><label>اسم ولي الأمر</label><input id="parentName" type="text" /></div>
      <div><label>رقم الهاتف</label><input id="phone" type="tel" /></div>
      <div><label>اسم المستلم</label><input id="receiver" type="text" /></div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" id="cancelBtn">إلغاء</button>
      <button class="btn-primary" id="saveBtn">حفظ الطفل</button>
    </div>
  `);

  document.getElementById('cancelBtn').onclick = closeModal;
  document.getElementById('saveBtn').onclick = saveNewChild;
};

function saveNewChild() {
  const childName = document.getElementById('childName').value.trim();
  const parentName = document.getElementById('parentName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const receiver = document.getElementById('receiver').value.trim();

  if (!childName || !parentName) {
    alert('يرجى إدخال اسم الطفل واسم ولي الأمر');
    return;
  }

  const newKid = {
    id: Date.now().toString(),
    childName, parentName, phone, receiver,
    entry: nowHHMM(),
    left: false
  };

  kids.unshift(newKid);
  saveKids(kids);
  renderTable(searchInput.value);
  closeModal();
}

function openCheckoutModal(id) {
  const kid = kids.find(k => k.id === id);
  if (!kid) return;

  const exitTime = nowHHMM();
  const duration = calcDuration(kid.entry, exitTime);

  openModal(`
    <h3>تسجيل مغادرة الطفل</h3>
    <p><strong>${kid.childName}</strong> | ولي الأمر: ${kid.parentName}</p>
    <p>الدخول: ${kid.entry} → الخروج: ${exitTime}</p>
    <p>المدة: ${duration}</p>
    <div class="modal-actions">
      <button class="btn-outline" id="cancelLeave">إلغاء</button>
      <button class="btn-primary" id="confirmLeave">تأكيد المغادرة</button>
    </div>
  `);

  document.getElementById('cancelLeave').onclick = closeModal;
  document.getElementById('confirmLeave').onclick = () => {
    kid.left = true;
    kid.exit = exitTime;
    kid.duration = duration;
    saveKids(kids);
    renderTable(searchInput.value);
    closeModal();
  };
}

function openModal(html) {
  modalContent.innerHTML = html;
  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

function nowHHMM() {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let total = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (total < 0) total += 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h} ساعة ${m} دقيقة`;
}

searchInput.oninput = e => renderTable(e.target.value);
clearSearch.onclick = () => { searchInput.value = ''; renderTable(''); };

btnExport.onclick = () => {
  const blob = new Blob([JSON.stringify(kids, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kids_backup.json';
  a.click();
};

btnImport.onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        kids = JSON.parse(ev.target.result);
        saveKids(kids);
        renderTable('');
      } catch {
        alert('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
modalOverlay.onclick = e => { if (e.target === modalOverlay) closeModal(); };

renderTable();
// اضافة طفل جديد
btnAdd.addEventListener('click', () => {
  openModal(`
    <div class="modal-content">
      <h3>إضافة طفل جديد</h3>
      <div class="form-group">
        <label>اسم الطفل</label>
        <input type="text" id="childName" placeholder="مثال: محمد علي">
      </div>
      <div class="form-group">
        <label>اسم ولي الأمر</label>
        <input type="text" id="parentName" placeholder="مثال: أحمد حسن">
      </div>
      <div class="form-group">
        <label>رقم الهاتف</label>
        <input type="tel" id="phone" placeholder="01012345678">
      </div>
      <div class="form-group">
        <label>اسم المستلم</label>
        <input type="text" id="receiver" placeholder="مثال: مروة">
      </div>
      <div class="modal-actions">
        <button class="btn-outline" id="cancelAdd">إلغاء</button>
        <button class="btn-primary" id="saveAdd">حفظ الطفل</button>
      </div>
    </div>
  `);

  document.getElementById('cancelAdd').addEventListener('click', closeModal);
  document.getElementById('saveAdd').addEventListener('click', saveNewChild);
});
