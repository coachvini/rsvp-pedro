(() => {
  const form = document.getElementById('rsvpForm');
  const submitBtn = document.getElementById('submitBtn');
  const successBox = document.getElementById('successBox');
  const successTitle = document.getElementById('successTitle');
  const successText = document.getElementById('successText');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const toast = document.getElementById('toast');

  const fields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone')
  };

  const config = window.RSVP_CONFIG;
  let supabase = null;

  function setError(input, message) {
    const span = form.querySelector(`.error-msg[data-for="${input.id}"]`);
    span.textContent = message || '';
    input.classList.toggle('invalid', Boolean(message));
  }

  function clearAllErrors() {
    Object.values(fields).forEach((input) => setError(input, ''));
  }

  function validate(input) {
    const value = input.value.trim();
    let message = '';

    if (!value) {
      message = 'Campo obrigatório';
    } else if (input.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = 'Informe um e-mail válido';
    } else if (input.id === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        message = 'Informe um celular válido com DDD';
      }
    }

    setError(input, message);
    return !message;
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  Object.values(fields).forEach((input) => {
    input.addEventListener('blur', () => validate(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) validate(input);
      if (input.id === 'phone') {
        input.value = formatPhone(input.value);
      }
    });
  });

  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function loadPartyInfo() {
    if (!config || !config.party) return;
    const p = config.party;
    document.title = `${p.title} - Confirme sua presença`;
    document.getElementById('partyTitle').textContent = p.title;
    document.getElementById('partyDate').textContent = p.date;
    document.getElementById('partyTime').textContent = p.time;
    document.getElementById('partyLocation').textContent = p.location;
    if (p.confirmBy) {
      document.getElementById('partyConfirmBy').textContent = p.confirmBy;
    }
    if (p.message) {
      document.getElementById('partyMessage').textContent = p.message;
    }
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    let allValid = true;
    Object.values(fields).forEach((input) => {
      if (!validate(input)) allValid = false;
    });
    if (!allValid) return;

    if (!supabase && !initSupabase()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const { data, error } = await supabase.rpc('confirm_response', {
        p_first_name: fields.firstName.value.trim(),
        p_last_name: fields.lastName.value.trim(),
        p_email: fields.email.value.trim().toLowerCase(),
        p_phone: fields.phone.value.replace(/\D/g, '')
      });

      if (error) {
        throw new Error(trataErro(error));
      }

      form.hidden = true;
      successBox.hidden = false;
      if (data && data.updated) {
        successTitle.textContent = 'Presença atualizada!';
        successText.textContent = 'Seus dados foram atualizados. Até a festa!';
      }
      window.scrollTo({ top: successBox.offsetTop - 20, behavior: 'smooth' });
    } catch (err) {
      errorText.textContent = err.message;
      errorBox.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar presença';
    }
  });

  function trataErro(error) {
    const msg = error.message || String(error);
    if (/function.*confirm_response.*does not exist|Could not find the function/i.test(msg)) {
      return 'Configuração pendente: rode o script supabase-setup.sql no Supabase.';
    }
    if (/permission|denied|violates row-level security/i.test(msg)) {
      return 'Configuração pendente: confira as políticas de segurança no Supabase.';
    }
    if (/fetch|network|Failed to fetch/i.test(msg)) {
      return 'Falha de conexão. Tente novamente em instantes.';
    }
    return 'Erro ao confirmar presença. Tente novamente.';
  }

  loadPartyInfo();
  initSupabase();
})();
