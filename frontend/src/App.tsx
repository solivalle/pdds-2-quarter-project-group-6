import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Ticket as TicketIcon,
  Upload,
  UserRound
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';
import type { AuthUser, NotificationRecord, PerformanceReport, Ticket, TicketFilters, TicketPriority, TicketStatus } from './types';

const STORAGE_KEY = 'ticketflow.session';
const priorities: TicketPriority[] = ['P0', 'P1', 'P2', 'P3', 'P4'];
const statuses: TicketStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'];
type WorkspaceView = 'tickets' | 'reports' | 'notifications';

const demoUsers = [
  { name: 'Ana Solicitante', email: 'ana@ticketflow.local', role: 'Solicitante' },
  { name: 'Luis Agente', email: 'luis@ticketflow.local', role: 'Agente' },
  { name: 'Sofia Supervisora', email: 'sofia@ticketflow.local', role: 'Supervisor' },
  { name: 'Admin TicketFlow', email: 'admin@ticketflow.local', role: 'Admin' }
];

interface Session {
  token: string;
  user: AuthUser;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

function readSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => readSession());

  function saveSession(next: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  return session
    ? <Workspace session={session} onLogout={logout} />
    : <LoginScreen onLogin={saveSession} />;
}

function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('ana@ticketflow.local');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login(email, password);
      onLogin(result);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="TicketFlow">
        <div className="brand-mark"><TicketIcon size={34} /></div>
        <h1>TicketFlow</h1>
        <p>Gestion de incidentes, SLA y trazabilidad operativa para equipos de soporte.</p>
        <div className="hero-metrics">
          <span><ShieldCheck size={18} /> JWT</span>
          <span><BarChart3 size={18} /> Reportes</span>
          <span><Bell size={18} /> SLA</span>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <h2 id="login-title">Iniciar sesion</h2>
        <form onSubmit={submit} className="login-form">
          <label>
            Correo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            <UserRound size={18} />
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="demo-list" aria-label="Usuarios demo">
          {demoUsers.map((demo) => (
            <button key={demo.email} type="button" onClick={() => setEmail(demo.email)}>
              <span>{demo.name}</span>
              <small>{demo.role}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Workspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({ includeClosed: true });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>('tickets');

  const isManager = session.user.role === 'SUPERVISOR' || session.user.role === 'ADMIN';
  const canManageTickets = session.user.role === 'AGENT' || isManager;
  const viewTitle = activeView === 'tickets' ? 'Panel operativo' : activeView === 'reports' ? 'Reportes' : 'Notificaciones';
  const viewEyebrow = activeView === 'tickets' ? session.user.role : 'Supervision';
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null;

  const metrics = useMemo(() => {
    const open = tickets.filter((ticket) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)).length;
    const atRisk = tickets.filter((ticket) => ticket.sla.isAtRisk || ticket.sla.isBreached).length;
    const resolved = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
    return { open, atRisk, resolved };
  }, [tickets]);

  async function loadData() {
    setLoading(true);
    try {
      const nextTickets = await api.listTickets(session.token, filters);
      setTickets(nextTickets);
      setSelectedId((current) => current && nextTickets.some((ticket) => ticket.id === current) ? current : nextTickets[0]?.id ?? null);

      if (isManager) {
        const [nextReport, nextNotifications] = await Promise.all([
          api.performanceReport(session.token),
          api.notifications(session.token)
        ]);
        setReport(nextReport);
        setNotifications(nextNotifications);
      }
    } catch (err) {
      setToast({ type: 'error', message: messageFromError(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [filters.status, filters.priority, filters.slaAtRisk, filters.includeClosed]);

  async function createTicket(input: { title: string; category: string; description: string; priority?: string; attachments?: File[] }) {
    try {
      const ticket = await api.createTicket(session.token, input);
      setToast({ type: 'success', message: `Ticket creado: ${ticket.id}` });
      await loadData();
      setSelectedId(ticket.id);
    } catch (err) {
      setToast({ type: 'error', message: messageFromError(err) });
    }
  }

  async function updateTicket(action: () => Promise<Ticket>, success: string) {
    try {
      const ticket = await action();
      setTickets((current) => current.map((item) => item.id === ticket.id ? ticket : item));
      setSelectedId(ticket.id);
      setToast({ type: 'success', message: success });
    } catch (err) {
      setToast({ type: 'error', message: messageFromError(err) });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <TicketIcon size={26} />
          <span>TicketFlow</span>
        </div>
        <nav aria-label="Principal">
          <button className={activeView === 'tickets' ? 'active' : ''} type="button" onClick={() => setActiveView('tickets')}>
            <ClipboardList size={18} /> Tickets
          </button>
          {isManager && (
            <button className={activeView === 'reports' ? 'active' : ''} type="button" onClick={() => setActiveView('reports')}>
              <BarChart3 size={18} /> Reportes
            </button>
          )}
          {isManager && (
            <button className={activeView === 'notifications' ? 'active' : ''} type="button" onClick={() => setActiveView('notifications')}>
              <Bell size={18} /> Notificaciones
            </button>
          )}
        </nav>
        <button className="ghost-button sidebar-logout" type="button" onClick={onLogout}>
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{viewEyebrow}</p>
            <h1>{viewTitle}</h1>
          </div>
          <div className="user-chip">
            <UserRound size={18} />
            <span>{session.user.name}</span>
          </div>
        </header>

        {toast && (
          <div className={`toast ${toast.type}`} role="status">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Cerrar aviso">x</button>
          </div>
        )}

        {activeView === 'tickets' && (
          <>
            <section className="metric-grid" aria-label="Resumen">
              <Metric icon={<ClipboardList size={22} />} label="Abiertos" value={metrics.open} />
              <Metric icon={<AlertTriangle size={22} />} label="SLA en riesgo" value={metrics.atRisk} danger={metrics.atRisk > 0} />
              <Metric icon={<CheckCircle2 size={22} />} label="Resueltos" value={metrics.resolved} />
              <Metric icon={<TicketIcon size={22} />} label="Total visible" value={tickets.length} />
            </section>

            <section className="content-grid" id="tickets">
              <div className="surface ticket-list">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Mesa de ayuda</p>
                    <h2>Tickets</h2>
                  </div>
                  <button className="icon-button" type="button" onClick={loadData} title="Actualizar tickets" aria-label="Actualizar tickets">
                    <RefreshCw size={18} />
                  </button>
                </div>

                <FilterBar filters={filters} onChange={setFilters} />
                {loading ? <p className="empty-state">Cargando tickets...</p> : <TicketTable tickets={tickets} selectedId={selectedTicket?.id} onSelect={setSelectedId} />}
              </div>

              <div className="side-stack">
                <CreateTicketPanel onCreate={createTicket} />
                <TicketDetail
                  ticket={selectedTicket}
                  token={session.token}
                  canManage={canManageTickets}
                  canUseInternalComments={canManageTickets}
                  onUpdate={updateTicket}
                />
              </div>
            </section>
          </>
        )}

        {isManager && activeView === 'reports' && <ReportView report={report} tickets={tickets} onRefresh={loadData} />}
        {isManager && activeView === 'notifications' && <NotificationView notifications={notifications} onRefresh={loadData} />}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: number; danger?: boolean }) {
  return (
    <div className={`metric ${danger ? 'danger' : ''}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function FilterBar({ filters, onChange }: { filters: TicketFilters; onChange: (filters: TicketFilters) => void }) {
  return (
    <div className="filter-bar">
      <Filter size={18} />
      <select aria-label="Estado" value={filters.status ?? ''} onChange={(event) => onChange({ ...filters, status: event.target.value as TicketStatus || undefined })}>
        <option value="">Todos los estados</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select aria-label="Prioridad" value={filters.priority ?? ''} onChange={(event) => onChange({ ...filters, priority: event.target.value as TicketPriority || undefined })}>
        <option value="">Todas las prioridades</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      <label className="check-control">
        <input type="checkbox" checked={Boolean(filters.slaAtRisk)} onChange={(event) => onChange({ ...filters, slaAtRisk: event.target.checked || undefined })} />
        SLA en riesgo
      </label>
      <label className="check-control">
        <input type="checkbox" checked={filters.includeClosed !== false} onChange={(event) => onChange({ ...filters, includeClosed: event.target.checked })} />
        Incluir cerrados
      </label>
    </div>
  );
}

function TicketTable({ tickets, selectedId, onSelect }: { tickets: Ticket[]; selectedId?: string; onSelect: (ticketId: string) => void }) {
  if (!tickets.length) return <p className="empty-state">No hay tickets para los filtros seleccionados.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>SLA</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className={ticket.id === selectedId ? 'selected' : ''} onClick={() => onSelect(ticket.id)}>
              <td>
                <button type="button" className="row-button" onClick={() => onSelect(ticket.id)}>
                  <strong>{ticket.title}</strong>
                  <span>{ticket.id} · {ticket.category}</span>
                </button>
              </td>
              <td><PriorityBadge priority={ticket.priority} /></td>
              <td><StatusBadge status={ticket.status} /></td>
              <td><SlaBadge ticket={ticket} /></td>
              <td>{formatDate(ticket.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateTicketPanel({ onCreate }: { onCreate: (input: { title: string; category: string; description: string; priority?: string; attachments?: File[] }) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('plataforma');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onCreate({ title, category, description, priority: priority || undefined, attachments });
    setSaving(false);
    setTitle('');
    setDescription('');
    setPriority('');
    setAttachments([]);
    setFileInputKey((value) => value + 1);
  }

  return (
    <section className="surface" aria-labelledby="create-ticket-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Registro</p>
          <h2 id="create-ticket-title">Nuevo ticket</h2>
        </div>
        <Plus size={20} />
      </div>
      <form className="ticket-form" onSubmit={submit}>
        <label>
          Titulo
          <input required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Categoria
          <input required minLength={2} maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label>
          Prioridad
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="">Sugerida por sistema</option>
            {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Descripcion
          <textarea required minLength={10} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Adjuntos
          <input
            key={fileInputKey}
            type="file"
            multiple
            onChange={(event) => setAttachments(Array.from(event.currentTarget.files ?? []).slice(0, 5))}
          />
        </label>
        <SelectedFiles files={attachments} />
        <button className="primary-button" type="submit" disabled={saving}>
          <Send size={18} />
          {saving ? 'Creando...' : 'Crear ticket'}
        </button>
      </form>
    </section>
  );
}

function SelectedFiles({ files }: { files: File[] }) {
  if (!files.length) return <p className="file-hint">Puedes cargar hasta 5 archivos, maximo 10 MB por archivo.</p>;

  return (
    <ul className="selected-files" aria-label="Archivos seleccionados">
      {files.map((file) => (
        <li key={`${file.name}-${file.size}-${file.lastModified}`}>
          <Paperclip size={15} />
          <span>{file.name}</span>
          <small>{formatFileSize(file.size)}</small>
        </li>
      ))}
    </ul>
  );
}

function TicketDetail({
  ticket,
  token,
  canManage,
  canUseInternalComments,
  onUpdate
}: {
  ticket: Ticket | null;
  token: string;
  canManage: boolean;
  canUseInternalComments: boolean;
  onUpdate: (action: () => Promise<Ticket>, success: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<TicketStatus>('IN_PROGRESS');
  const [reason, setReason] = useState('');
  const [agentId, setAgentId] = useState('');
  const [comment, setComment] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setAgentId(ticket.assignedAgentId ?? 'AGE-2001');
      setReason('');
      setComment('');
      setAttachmentFiles([]);
      setAttachmentError('');
      setAttachmentInputKey((value) => value + 1);
    }
  }, [ticket?.id]);

  if (!ticket) {
    return (
      <section className="surface detail-panel">
        <p className="empty-state">Selecciona o crea un ticket para ver el detalle.</p>
      </section>
    );
  }

  return (
    <section className="surface detail-panel" aria-labelledby="detail-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">{ticket.id}</p>
          <h2 id="detail-title">{ticket.title}</h2>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className="description">{ticket.description}</p>
      <dl className="detail-list">
        <div><dt>Estado</dt><dd><StatusBadge status={ticket.status} /></dd></div>
        <div><dt>Agente</dt><dd>{ticket.assignedAgentId ?? 'Sin asignar'}</dd></div>
        <div><dt>Vence respuesta</dt><dd>{formatDate(ticket.sla.responseDueAt)}</dd></div>
        <div><dt>Vence resolucion</dt><dd>{formatDate(ticket.sla.resolutionDueAt)}</dd></div>
      </dl>
      <SlaSummary ticket={ticket} />

      <div className="attachments">
        <h3><Paperclip size={18} /> Adjuntos</h3>
        <div className="attachment-list">
          {ticket.attachments.length ? ticket.attachments.map((attachment) => (
            <article key={attachment.id}>
              <div>
                <strong>{attachment.fileName}</strong>
                <small>{formatFileSize(attachment.sizeBytes)} · {formatDate(attachment.uploadedAt)}</small>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Descargar adjunto"
                aria-label={`Descargar ${attachment.fileName}`}
                disabled={downloadingAttachmentId === attachment.id}
                onClick={async () => {
                  setDownloadingAttachmentId(attachment.id);
                  setAttachmentError('');
                  try {
                    const blob = await api.downloadAttachment(token, ticket.id, attachment.id);
                    downloadBlob(blob, attachment.fileName);
                  } catch (err) {
                    setAttachmentError(messageFromError(err));
                  } finally {
                    setDownloadingAttachmentId(null);
                  }
                }}
              >
                <Download size={18} />
              </button>
            </article>
          )) : <p className="empty-state">Sin adjuntos todavia.</p>}
        </div>
        {attachmentError && <p className="form-error">{attachmentError}</p>}

        <form className="attachment-upload" onSubmit={async (event) => {
          event.preventDefault();
          if (!attachmentFiles.length) return;
          await onUpdate(() => api.addAttachments(token, ticket.id, attachmentFiles), 'Adjuntos cargados');
          setAttachmentFiles([]);
          setAttachmentInputKey((value) => value + 1);
        }}>
          <label>
            Agregar archivos
            <input
              key={attachmentInputKey}
              type="file"
              multiple
              onChange={(event) => setAttachmentFiles(Array.from(event.currentTarget.files ?? []).slice(0, 5))}
            />
          </label>
          <SelectedFiles files={attachmentFiles} />
          <button className="secondary-button" type="submit" disabled={!attachmentFiles.length}>
            <Upload size={18} />
            Subir adjuntos
          </button>
        </form>
      </div>

      {canManage && (
        <div className="management-tools">
          <label>
            Cambiar estado
            <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)}>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Motivo
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Actualizacion operativa" />
          </label>
          <button className="secondary-button" type="button" onClick={() => onUpdate(
            () => api.updateStatus(token, ticket.id, status, reason || undefined),
            ['RESOLVED', 'CLOSED'].includes(status) ? 'Estado actualizado y snapshot enviado a cola' : 'Estado actualizado'
          )}>
            Actualizar estado
          </button>

          <label>
            Asignar agente
            <input value={agentId} onChange={(event) => setAgentId(event.target.value)} placeholder="AGE-2001" />
          </label>
          <button className="secondary-button" type="button" onClick={() => onUpdate(() => api.assignTicket(token, ticket.id, agentId, reason || undefined), 'Asignacion actualizada')}>
            Reasignar
          </button>
        </div>
      )}

      <div className="comments">
        <h3><MessageSquare size={18} /> Comentarios</h3>
        <form onSubmit={(event) => {
          event.preventDefault();
          void onUpdate(() => api.addComment(token, ticket.id, comment, visibility), 'Comentario agregado');
        }}>
          <textarea aria-label="Comentario" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Agregar seguimiento" />
          <div className="comment-actions">
            {canUseInternalComments && (
              <select aria-label="Visibilidad" value={visibility} onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'INTERNAL')}>
                <option value="PUBLIC">Publico</option>
                <option value="INTERNAL">Interno</option>
              </select>
            )}
            <button className="secondary-button" type="submit" disabled={!comment.trim()}>Comentar</button>
          </div>
        </form>
        <div className="comment-list">
          {ticket.comments.length ? ticket.comments.slice().reverse().map((item) => (
            <article key={item.id}>
              <strong>{item.authorRole} · {item.visibility}</strong>
              <p>{item.content}</p>
              <small>{formatDate(item.createdAt)}</small>
            </article>
          )) : <p className="empty-state">Sin comentarios todavia.</p>}
        </div>
      </div>
    </section>
  );
}

function ReportView({ report, tickets, onRefresh }: { report: PerformanceReport | null; tickets: Ticket[]; onRefresh: () => void }) {
  const breached = tickets.filter((ticket) => ticket.sla.isBreached).length;

  return (
    <section className="view-stack" aria-labelledby="report-title">
      <div className="view-toolbar">
        <div>
          <p className="eyebrow">Indicadores</p>
          <h2 id="report-title">Rendimiento del servicio</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh}>
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>
      {report ? (
        <>
          <div className="metric-grid">
            <Metric icon={<TicketIcon size={22} />} label="Tickets totales" value={report.totalTickets} />
            <Metric icon={<ClipboardList size={22} />} label="Abiertos" value={report.openTickets} />
            <Metric icon={<CheckCircle2 size={22} />} label="Resueltos" value={report.resolvedTickets} />
            <Metric icon={<AlertTriangle size={22} />} label="SLA vencidos" value={breached} danger={breached > 0} />
          </div>

          <div className="report-layout">
            <div className="surface report-summary">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">SLA</p>
                  <h3>Cumplimiento</h3>
                </div>
                <strong>{Math.round(report.slaComplianceRate * 100)}%</strong>
              </div>
              <div className="progress-track" aria-label="Cumplimiento SLA">
                <span style={{ width: `${Math.round(report.slaComplianceRate * 100)}%` }} />
              </div>
              <dl className="report-facts">
                <div>
                  <dt>Tiempo promedio</dt>
                  <dd>{report.averageResolutionMinutes ?? 0} min</dd>
                </div>
                <div>
                  <dt>Generado</dt>
                  <dd>{formatDate(report.generatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="surface">
              <MiniBars title="Tickets por prioridad" items={report.ticketsByPriority.map((item) => ({ label: item.priority, value: item.total }))} />
            </div>

            <div className="surface">
              <MiniBars title="Tickets por categoria" items={report.ticketsByCategory.map((item) => ({ label: item.category, value: item.total }))} />
            </div>

            <div className="surface">
              <MiniBars title="Carga por agente" items={report.ticketsByAgent.map((item) => ({ label: item.agentId, value: item.total }))} />
            </div>
          </div>
        </>
      ) : <p className="empty-state">Sin reporte disponible.</p>}
    </section>
  );
}

function NotificationView({ notifications, onRefresh }: { notifications: NotificationRecord[]; onRefresh: () => void }) {
  return (
    <section className="view-stack" aria-labelledby="notifications-title">
      <div className="view-toolbar">
        <div>
          <p className="eyebrow">Historial operativo</p>
          <h2 id="notifications-title">Notificaciones</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh}>
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      <div className="notification-board">
        <section className="surface notification-focus">
          <Bell size={28} />
          <strong>{notifications.length}</strong>
          <span>eventos registrados</span>
        </section>
        <section className="surface notification-list">
          {notifications.length ? notifications.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.event}</strong>
                <p>{item.recipient}</p>
              </div>
              <span className="badge status">{item.channel}</span>
              <small>{item.ticketId} · {formatDate(item.createdAt)}</small>
            </article>
          )) : <p className="empty-state">No hay notificaciones registradas.</p>}
        </section>
      </div>
    </section>
  );
}

function MiniBars({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="mini-bars">
      <h3>{title}</h3>
      {items.length ? items.slice(0, 6).map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <div><i style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} /></div>
          <strong>{item.value}</strong>
        </div>
      )) : <p className="empty-state">Sin datos.</p>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`badge priority ${priority.toLowerCase()}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge status ${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>;
}

function SlaBadge({ ticket }: { ticket: Ticket }) {
  return <span className={`badge sla ${slaState(ticket)}`}>{slaLabel(ticket)}</span>;
}

function SlaSummary({ ticket }: { ticket: Ticket }) {
  const progress = slaProgress(ticket);

  return (
    <div className={`sla-summary ${slaState(ticket)}`}>
      <div className="sla-summary-header">
        <div>
          <span className="eyebrow">SLA</span>
          <strong>{slaLabel(ticket)}</strong>
        </div>
        <span>{formatSlaTiming(ticket)}</span>
      </div>
      <div className="progress-track" aria-label="Avance del SLA">
        <span style={{ width: `${progress}%` }} />
      </div>
      <dl>
        <div><dt>Respuesta</dt><dd>{ticket.sla.firstResponseAt ? formatDate(ticket.sla.firstResponseAt) : 'Pendiente'}</dd></div>
        <div><dt>Cierre</dt><dd>{ticket.sla.resolvedAt ? formatDate(ticket.sla.resolvedAt) : 'Pendiente'}</dd></div>
      </dl>
    </div>
  );
}

function slaState(ticket: Ticket): 'ok' | 'risk' | 'breached' | 'resolved' {
  if (ticket.sla.isBreached) return 'breached';
  if (ticket.sla.resolvedAt) return 'resolved';
  if (ticket.sla.isAtRisk) return 'risk';
  return 'ok';
}

function slaLabel(ticket: Ticket): string {
  if (ticket.sla.isBreached) return 'Vencido';
  if (ticket.sla.resolvedAt) return 'Cumplido';
  if (ticket.sla.isAtRisk) return 'En riesgo';
  return 'En tiempo';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function slaProgress(ticket: Ticket): number {
  const created = new Date(ticket.createdAt).getTime();
  const due = new Date(ticket.sla.resolutionDueAt).getTime();
  const effectiveNow = ticket.sla.resolvedAt ? new Date(ticket.sla.resolvedAt).getTime() : Date.now();
  const total = Math.max(1, due - created);
  const consumed = Math.max(0, effectiveNow - created);
  return Math.min(100, Math.round((consumed / total) * 100));
}

function formatSlaTiming(ticket: Ticket): string {
  const due = new Date(ticket.sla.resolutionDueAt).getTime();
  const compare = ticket.sla.resolvedAt ? new Date(ticket.sla.resolvedAt).getTime() : Date.now();
  const diff = due - compare;
  const prefix = ticket.sla.resolvedAt
    ? diff >= 0 ? 'Cerrado a tiempo' : 'Cerrado tarde'
    : diff >= 0 ? 'Restan' : 'Vencido hace';
  return `${prefix} ${formatDuration(Math.abs(diff))}`;
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.max(0, Math.round(milliseconds / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days} d ${remainingHours} h` : `${days} d`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrio un error inesperado';
}
