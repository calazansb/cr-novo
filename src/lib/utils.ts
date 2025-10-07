import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para abrir email usando mailto
export function openEmail(subject: string, body: string, to?: string) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  const mailtoUrl = `mailto:${to || ''}?subject=${encodedSubject}&body=${encodedBody}`;
  
  // Cria um link temporário e simula clique
  const link = document.createElement('a');
  link.href = mailtoUrl;
  link.target = '_blank';
  link.style.display = 'none';
  document.body.appendChild(link);
  
  try {
    link.click();
  } catch (error) {
    // Fallback: tenta window.open
    try {
      window.open(mailtoUrl);
    } catch (e) {
      // Se não funcionar, copia para clipboard
      navigator.clipboard.writeText(`Para: ${to || ''}\nAssunto: ${subject}\n\n${body}`).then(() => {
        alert('Link de email foi copiado para a área de transferência. Cole em seu cliente de email.');
      }).catch(() => {
        alert(`Abra seu cliente de email e use:\nPara: ${to || ''}\nAssunto: ${subject}`);
      });
    }
  } finally {
    document.body.removeChild(link);
  }
}

// Função para tentar abrir WhatsApp nativo primeiro e só usar web como fallback SE necessário
export function openWhatsApp(message: string, phoneNumber?: string) {
  const encodedMessage = encodeURIComponent(message);
  const cleanedPhone = phoneNumber?.replace(/[^\d]/g, "");

  // URL do app nativo (tenta primeiro)
  const nativeUrl = cleanedPhone
    ? `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`
    : `whatsapp://send?text=${encodedMessage}`;

  // Fallback usando wa.me (mais simples e confiável que web.whatsapp.com)
  const webUrl = cleanedPhone
    ? `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  // Cria um link temporário para tentar abrir o app
  const tempLink = document.createElement('a');
  tempLink.href = nativeUrl;
  tempLink.style.display = 'none';
  document.body.appendChild(tempLink);

  let openedNative = false;
  let fallbackTimer: number;

  function cleanup() {
    window.removeEventListener('blur', markOpened);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (tempLink.parentNode) document.body.removeChild(tempLink);
  }

  const markOpened = () => {
    openedNative = true;
    cleanup();
  };

  const onVisibilityChange = () => {
    // Se a página ficou oculta, assumimos que o app nativo foi aberto
    if (document.hidden) markOpened();
  };

  // Se a janela perder o foco ou ficar oculta, consideramos sucesso no nativo
  window.addEventListener('blur', markOpened);
  document.addEventListener('visibilitychange', onVisibilityChange);

  try {
    tempLink.click();

    // Só cai para o web se continuar visível/de foco após um curto período
    fallbackTimer = window.setTimeout(() => {
      if (!openedNative && !document.hidden) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
      cleanup();
    }, 1800);
  } catch (error) {
    // Se falhar imediatamente, abre o web
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    cleanup();
  }
}

// Formata código da solicitação para o padrão CTRL-DD-MM-YYYY-NNNN
export function formatCodigo(codigo: string): string {
  if (!codigo) return codigo;
  const m1 = codigo.match(/^CTRL-(\d{8})-(\d{4})$/); // Ex.: CTRL-20251007-0004
  if (m1) {
    const y = m1[1].slice(0, 4);
    const mo = m1[1].slice(4, 6);
    const d = m1[1].slice(6, 8);
    return `CTRL-${d}-${mo}-${y}-${m1[2]}`;
  }
  // Se já estiver no formato novo, retorna como está
  const m2 = codigo.match(/^CTRL-\d{2}-\d{2}-\d{4}-\d{4}$/);
  if (m2) return codigo;
  return codigo;
}
