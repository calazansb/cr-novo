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

// Função para abrir WhatsApp com fallback robusto (nativo -> web -> wa.me)
export function openWhatsApp(message: string, phoneNumber?: string) {
  const encodedMessage = encodeURIComponent(message);
  const cleanedPhone = (phoneNumber || '').replace(/[^\d]/g, "");
  const hasPhone = !!cleanedPhone;

  const schemeUrl = hasPhone
    ? `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`
    : `whatsapp://send?text=${encodedMessage}`;

  // Preferir WhatsApp Web no desktop para evitar bloqueios do api.whatsapp.com
  const webUrl = hasPhone
    ? `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?text=${encodedMessage}`;

  // Fallback final (pode redirecionar para api.whatsapp.com em alguns casos)
  const waUrl = hasPhone
    ? `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Tenta abrir o app nativo primeiro; se não abrir, cai para wa.me
    let opened = false;
    let timer: number;

    const cleanup = () => {
      window.removeEventListener('blur', markOpened);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timer) window.clearTimeout(timer);
    };

    const markOpened = () => { opened = true; cleanup(); };
    const onVisibilityChange = () => { if (document.hidden) markOpened(); };

    window.addEventListener('blur', markOpened);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Usa um link temporário para acionar o esquema nativo
    const link = document.createElement('a');
    link.href = schemeUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      if (link.parentNode) document.body.removeChild(link);
    }

    // Se continuar visível após um curto período, faz fallback
    timer = window.setTimeout(() => {
      if (!opened && !document.hidden) {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
      cleanup();
    }, 1200);

    return;
  }

  // Desktop: abre WhatsApp Web; se bloqueado, cai para wa.me
  const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
  if (!win || win.closed) {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
