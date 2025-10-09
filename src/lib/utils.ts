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

// Função para abrir WhatsApp - usa wa.me que funciona melhor em todos os dispositivos
export function openWhatsApp(message: string, phoneNumber?: string) {
  const encodedMessage = encodeURIComponent(message);
  const cleanedPhone = (phoneNumber || '').replace(/[^\d]/g, "");
  
  // wa.me é a forma mais confiável - abre o app nativo se disponível
  const waUrl = cleanedPhone
    ? `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  // Abre em uma nova aba
  const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
  
  // Se o popup foi bloqueado, tenta uma abordagem alternativa
  if (!win || win.closed || typeof win.closed === 'undefined') {
    // Cria um link e simula clique (funciona melhor em alguns navegadores)
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
    }
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
