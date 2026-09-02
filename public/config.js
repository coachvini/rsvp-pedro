/* ============================================================
   CONFIGURAÇÃO DO SITE (versão GitHub Pages + Supabase)
   Preencha os valores abaixo com os dados do seu projeto Supabase:
   - Dashboard do Supabase > Project Settings > API
   - Project URL: https://xxxx.supabase.co
   - anon public key: começa com "eyJ..."
   ============================================================ */
window.RSVP_CONFIG = {
  supabaseUrl: "https://lcukwbxrivqvbpeaatbu.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWt3YnhyaXZxdmJwZWFhdGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY3MzgsImV4cCI6MjEwMzg4MjczOH0.0iYDiZDc4wUGhgxbDOvH8NHzgdqmwgYeR1ohPLP915I",

  /* Nome da tabela criada pelo script supabase-setup.sql */
  table: "responses",

  /* Informações da festa (editável) */
  party: {
    title: "Aniversário do Pedro",
    date: "27/09/2026",
    time: "12:00",
    location: "Fest Kids - Rua José Lourenço, 790, São Pedro",
    confirmBy: "14/09/2026",
    message: "Sua presença é muito especial! Confirme abaixo e venha comemorar com a gente."
  }
};
