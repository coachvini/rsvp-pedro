(() => {
  const loginCard = document.getElementById('loginCard');
  const panelCard = document.getElementById('panelCard');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const adminEmail = document.getElementById('adminEmail');
  const adminPassword = document.getElementById('adminPassword');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const responsesBody = document.getElementById('responsesBody');
  const emptyState = document.getElementById('emptyState');
  const toast = document.getElementById('toast');

  const config = window.RSVP_CONFIG;
  let supabase = null;
  let responses = [];

  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function initSupabase() {
    if (!config || !config.supabaseUrl || config.supabaseUrl.includes('SEU-PROJETO')) {
      showToast('Site ainda não configurado. Adicione a URL do Supabase em config.js');
      return false;
    }
    if (typeof window.supabase === 'undefined') {
      showToast('Erro ao carregar o Supabase. Verifique sua conexão.');
      return false;
    }
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return true;
  }

  function showLogin() {
    panelCard.hidden = true;
    loginCard.hidden = false;
  }

  function showPanel() {
    loginCard.hidden = true;
    panelCard.hidden = false;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPhone(digits) {
    if (!digits) return '—';
    const d = String(digits);
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTable() {
    responsesBody.innerHTML = '';
    emptyState.hidden = responses.length > 0;

    responses.forEach((r) => {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.innerHTML = `<strong>${escapeHtml(r.first_name)} ${escapeHtml(r.last_name)}</strong>`;

      const emailTd = document.createElement('td');
      emailTd.textContent = r.email;

      const phoneTd = document.createElement('td');
      phoneTd.textContent = formatPhone(r.phone);

      const dateTd = document.createElement('td');
      dateTd.textContent = formatDate(r.created_at);

      const actionTd = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Remover';
      delBtn.title = 'Remover confirmação';
      delBtn.addEventListener('click', () => removeResponse(r.id, delBtn));

      actionTd.appendChild(delBtn);

      tr.append(nameTd, emailTd, phoneTd, dateTd, actionTd);
      responsesBody.appendChild(tr);
    });

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayCount = responses.filter(
      (r) => new Date(r.created_at).getTime() >= todayStart
    ).length;

    document.getElementById('statTotal').textContent = responses.length;
    document.getElementById('statToday').textContent = todayCount;
  }

  async function loadResponses() {
    const { data, error } = await supabase
      .from(config.table)
      .select('id, first_name, last_name, email, phone, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      showToast(trataErro(error));
      return;
    }
    responses = data || [];
    renderTable();
  }

  async function removeResponse(id, btn) {
    if (!confirm('Remover esta confirmação?')) return;
    btn.disabled = true;
    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq('id', id);
    if (error) {
      showToast(trataErro(error));
      btn.disabled = false;
      return;
    }
    responses = responses.filter((r) => r.id !== id);
    renderTable();
    showToast('Confirmação removida');
  }

  function exportCsv() {
    const header = ['Nome', 'Sobrenome', 'Email', 'Celular', 'Confirmado em'];
    const rows = responses.map((r) => [
      r.first_name,
      r.last_name,
      r.email,
      r.phone,
      r.created_at
    ]);

    const escapeCell = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'confirmacoes-pedro.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exportado');
  }

  function setError(input, message) {
    const span = loginForm.querySelector(`.error-msg[data-for="${input.id}"]`);
    span.textContent = message || '';
    input.classList.toggle('invalid', Boolean(message));
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    setError(adminEmail, '');
    setError(adminPassword, '');

    if (!adminEmail.value.trim() || !adminPassword.value) {
      if (!adminEmail.value.trim()) setError(adminEmail, 'Informe o e-mail');
      if (!adminPassword.value) setError(adminPassword, 'Informe a senha');
      return;
    }

    if (!initSupabase()) return;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.value.trim(),
        password: adminPassword.value
      });
      if (error) throw error;

      adminEmail.value = '';
      adminPassword.value = '';
      showPanel();
      await loadResponses();
    } catch (err) {
      errorText.textContent = trataErroLogin(err);
      errorBox.hidden = false;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });

  function trataErroLogin(err) {
    const msg = err.message || String(err);
    if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(msg)) {
      return 'E-mail ainda não confirmado. Confirme o link enviado pelo Supabase.';
    }
    if (/fetch|network|Failed to fetch/i.test(msg)) return 'Falha de conexão. Tente novamente.';
    return msg;
  }

  function trataErro(error) {
    const msg = error.message || String(error);
    if (/JWT|invalid api key/i.test(msg)) return 'Configuração inválida em config.js.';
    if (/permission|denied|violates row-level security/i.test(msg)) {
      return 'Sem permissão: rode o supabase-setup.sql e confira o usuário do painel.';
    }
    if (/fetch|network|Failed to fetch/i.test(msg)) return 'Falha de conexão. Tente novamente.';
    return msg;
  }

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
  });

  refreshBtn.addEventListener('click', loadResponses);
  exportCsvBtn.addEventListener('click', exportCsv);

  (async () => {
    if (!initSupabase()) {
      showLogin();
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      showPanel();
      await loadResponses();
    } else {
      showLogin();
    }
  })();
})();
