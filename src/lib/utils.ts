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
  // Copia mensagem para área de transferência
  navigator.clipboard?.writeText(message).catch(() => {
    console.error('Erro ao copiar mensagem');
  });

  // Abre WhatsApp Web sem número específico para selecionar contato
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
  
  // Abre em nova aba
  const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
  // Se bloqueado por popup blocker, tenta método alternativo
  if (!win || win.closed) {
    // Tenta app nativo
    try {
      window.location.href = `whatsapp://send?text=${encodedMessage}`;
    } catch {
      alert('A mensagem foi copiada. Por favor, abra o WhatsApp e cole manualmente.');
    }
  }
}

// Função para abrir grupo do WhatsApp e copiar mensagem
export function openWhatsAppGroup(message: string, groupUrl: string) {
  // Extrai o código do grupo do URL
  const groupCode = groupUrl.split('/').pop();
  
  // Primeiro copia a mensagem
  navigator.clipboard?.writeText(message).then(() => {
    // Tenta abrir usando o esquema whatsapp:// direto para o grupo
    try {
      window.location.href = `whatsapp://chat?code=${groupCode}`;
    } catch {
      // Se falhar, usa o link web tradicional
      window.open(groupUrl, '_blank', 'noopener,noreferrer');
    }
    
    // Mostra confirmação
    setTimeout(() => {
      alert('Mensagem copiada! Cole no grupo do WhatsApp.');
    }, 500);
  }).catch(() => {
    // Se falhar ao copiar, ainda tenta abrir o grupo
    try {
      window.location.href = `whatsapp://chat?code=${groupCode}`;
    } catch {
      window.open(groupUrl, '_blank', 'noopener,noreferrer');
    }
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
