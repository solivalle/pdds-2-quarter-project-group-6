import { TicketPriority } from './enums';

const categoryPriority: Record<string, TicketPriority> = {
  security: 'P0',
  seguridad: 'P0',
  production: 'P0',
  produccion: 'P0',
  pagos: 'P1',
  payment: 'P1',
  network: 'P1',
  red: 'P1',
  access: 'P2',
  acceso: 'P2',
  hardware: 'P3',
  general: 'P4'
};

const keywordPriority: Array<{ priority: TicketPriority; words: string[] }> = [
  { priority: 'P0', words: ['caido', 'down', 'critico', 'critical', 'brecha', 'security breach', 'produccion detenida'] },
  { priority: 'P1', words: ['error 500', 'pago', 'payment', 'bloqueado', 'bloqueada', 'no funciona'] },
  { priority: 'P2', words: ['lento', 'degradado', 'intermitente', 'timeout'] },
  { priority: 'P3', words: ['consulta', 'configuracion', 'permiso'] }
];

const rank: Record<TicketPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

export function suggestPriority(input: { title: string; category: string }): TicketPriority {
  const text = `${input.title} ${input.category}`.toLowerCase();
  const category = input.category.toLowerCase();
  let selected: TicketPriority = categoryPriority[category] ?? 'P4';

  for (const rule of keywordPriority) {
    if (rule.words.some((word) => text.includes(word)) && rank[rule.priority] < rank[selected]) {
      selected = rule.priority;
    }
  }

  return selected;
}
