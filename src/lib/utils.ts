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

// Função para abrir WhatsApp com prioridade para o app nativo (evita api.whatsapp.com bloqueado)
export function openWhatsApp(message: string, phoneNumber?: string) {
  const encodedMessage = encodeURIComponent(message);
  const cleanedPhone = (phoneNumber || '').replace(/[^\d]/g, "");
  const hasPhone = !!cleanedPhone;

  const schemeUrl = hasPhone
    ? `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`
    : `whatsapp://send?text=${encodedMessage}`;

  const webUrl = hasPhone
    ? `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?text=${encodedMessage}`;

  const waUrl = hasPhone
    ? `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

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

  // 1) Tenta abrir o app nativo (desktop e mobile)
  try {
    window.location.href = schemeUrl;
  } catch {}

  // 2) Se não abrir o app em ~1.2s, tenta web.whatsapp.com e depois wa.me
  timer = window.setTimeout(() => {
    if (!opened && !document.hidden) {
      const winWeb = window.open(webUrl, '_blank', 'noopener,noreferrer');
      if (!winWeb || winWeb.closed) {
        const winWa = window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (!winWa || winWa.closed) {
          // 3) Último recurso: copiar mensagem
          navigator.clipboard?.writeText(message).then(() => {
            alert('Não foi possível abrir o WhatsApp automaticamente. A mensagem foi copiada; cole no seu WhatsApp.');
          }).catch(() => {
            alert('Não foi possível abrir o WhatsApp. Por favor, abra o app e cole a mensagem.');
          });
        }
      }
    }
    cleanup();
  }, 1200);
}

// Função para abrir grupo do WhatsApp e copiar mensagem
export function openWhatsAppGroup(message: string, groupUrl: string) {
  // Primeiro copia a mensagem
  navigator.clipboard?.writeText(message).then(() => {
    // Depois abre o link do grupo
    window.open(groupUrl, '_blank', 'noopener,noreferrer');
    
    // Mostra confirmação
    setTimeout(() => {
      alert('Mensagem copiada! Cole no grupo do WhatsApp que acabou de abrir.');
    }, 500);
  }).catch(() => {
    // Se falhar ao copiar, ainda abre o grupo
    window.open(groupUrl, '_blank', 'noopener,noreferrer');
    alert('Abri o grupo do WhatsApp. Por favor, copie e cole a mensagem manualmente:\n\n' + message);
  });
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
