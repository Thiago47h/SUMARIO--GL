const COORD_EMAIL = 'claudio.teste@example.com';
const COORD_PASSWORD = 'claudio123';
const TEACHER = 'Ana Beatriz Moura';
const TODAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const WD = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const WDS = ['dom','seg','ter','qua','qui','sex','sáb'];
const MO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const KEY = 'genesis-sumarios-v1';
const SEED = [
  { id: 1, date: '2026-11-06', turma: '9º Ano A', disciplina: 'Língua Portuguesa', aulas: [3, 4], paginas: '108 a 111', conteudo: 'Orações subordinadas adverbiais: causais, concessivas e condicionais. Leitura de trechos de notícias e identificação das conjunções.', tarefa: 'Exercícios 1 a 6, página 112 do livro.', obs: '' },
  { id: 2, date: '2026-11-06', turma: '7º Ano A', disciplina: 'Redação', aulas: [5], conteudo: 'Produção de texto: relato pessoal. Planejamento em tópicos e escrita do primeiro rascunho.', tarefa: 'Terminar o rascunho do relato (mín. 15 linhas).', obs: 'Três alunos ausentes: Davi, Lívia e Rafael.' },
  { id: 3, date: '2026-11-05', turma: '8º Ano B', disciplina: 'Literatura', aulas: [2], paginas: '45 a 52', conteudo: 'Leitura compartilhada do conto “A Cartomante”, de Machado de Assis. Discussão sobre narrador e ironia.', tarefa: '', obs: '' },
  { id: 4, date: '2026-11-04', turma: '9º Ano A', disciplina: 'Língua Portuguesa', aulas: [1, 2], conteudo: 'Revisão de período composto por coordenação. Correção coletiva da tarefa anterior.', tarefa: '', obs: 'Turma participativa; retomar conjunções adversativas na próxima aula.' },
  { id: 5, date: '2026-11-03', turma: '7º Ano A', disciplina: 'Língua Portuguesa', aulas: [3], paginas: '60 a 63', conteudo: 'Substantivos: classificação (comum, próprio, coletivo). Atividade em duplas com textos jornalísticos.', tarefa: 'Lista de coletivos — folha entregue em sala.', obs: '' },
  { id: 6, date: '2026-10-30', turma: '8º Ano B', disciplina: 'Redação', aulas: [4, 5], conteudo: 'Texto dissertativo-argumentativo: estrutura da introdução e tese. Análise de redações modelo.', tarefa: 'Escrever uma introdução sobre o tema “uso de celulares na escola”.', obs: '' },
  { id: 7, date: '2026-10-29', turma: '9º Ano A', disciplina: 'Literatura', aulas: [6], conteudo: 'Modernismo brasileiro: Semana de Arte Moderna de 1922. Leitura de poemas de Oswald de Andrade.', tarefa: '', obs: '' },
  { id: 8, date: '2026-10-28', turma: '7º Ano A', disciplina: 'Língua Portuguesa', aulas: [1, 2, 3], conteudo: 'Avaliação bimestral de interpretação de texto e gramática (substantivos e adjetivos).', tarefa: '', obs: 'Aluna Sofia fará prova de segunda chamada.' },
];
const dp = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const pad = n => String(n).padStart(2, '0');
const fmt = iso => { const d = dp(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };
const isoDate = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
const weekStart = iso => {
  const monday = dp(iso);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return isoDate(monday);
};
const weekEnd = iso => {
  const friday = dp(weekStart(iso));
  friday.setDate(friday.getDate() + 4);
  return isoDate(friday);
};
const periodLabel = (start, end) => end && end !== start ? fmt(start) + ' a ' + fmt(end) : fmt(start);
const aulasLabel = a => { const s = [...a].sort((x, y) => x - y).map(n => n + 'ª'); if (!s.length) return ''; if (s.length === 1) return s[0] + ' aula'; return s.slice(0, -1).join(', ') + ' e ' + s[s.length - 1] + ' aulas'; };
const blank = () => ({ date: weekStart(TODAY), endDate: weekEnd(TODAY), turma: '', disciplina: '', aulas: [], paginas: '', conteudo: '', tarefa: '', obs: '' });
const deco = r => { const d = dp(r.date); return { ...r, dayMonth: pad(d.getDate()) + '/' + pad(d.getMonth() + 1), year: d.getFullYear(), weekday: WD[d.getDay()], weekdayShort: WDS[d.getDay()], dateShort: periodLabel(r.date, r.endDate), dateLong: r.endDate && r.endDate !== r.date ? periodLabel(r.date, r.endDate) : WD[d.getDay()] + ', ' + d.getDate() + ' de ' + MO[d.getMonth()] + ' de ' + d.getFullYear(), aulasLabel: aulasLabel(r.aulas) }; };
const sortDesc = (a, b) => b.date.localeCompare(a.date) || Math.max(...b.aulas) - Math.max(...a.aulas);

function groupPrintRecords(records, monthly) {
  const groups = new Map();
  for (const record of records) {
    const monday = dp(record.date);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const label = date => date.toLocaleDateString('pt-BR');
    const periodKey = monthly ? record.date.slice(0, 7) : monday.getTime();
    const period = monthly
      ? MO[Number(record.date.slice(5, 7)) - 1] + ' de ' + record.date.slice(0, 4)
      : label(monday) + ' a ' + label(friday);
    const groupKey = periodKey + '|' + record.turma;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        turma: record.turma,
        period,
        days: new Map(),
      });
    }
    const { days } = groups.get(groupKey);
    if (!days.has(record.date)) days.set(record.date, { title: record.dateLong, records: [] });
    days.get(record.date).records.push(record);
  }
  return [...groups.values()].map(group => ({ ...group, days: [...group.days.values()] }));
}

class Component extends DCLogic {
  state = (() => {
    let records = SEED;
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s) && s.length) records = s; } catch (e) {}
    return { screen: 'login', coordinator: false, email: 'ana.moura@example.com', password: 'senha123', loginError: '', records, f: blank(), editingId: null, formError: '', flt: { turma: '', disciplina: '', from: '', to: '' }, selected: [], printIds: [], printFormat: 'weekly', openId: null, toast: '', splash: '', rise: false };
  })();

  persist(records) { try { localStorage.setItem(KEY, JSON.stringify(records)); } catch (e) {} }
  go(screen, extra) { this.setState({ screen, openId: null, ...(extra || {}) }); window.scrollTo(0, 0); }
  flash(msg) { clearTimeout(this._t); this.setState({ toast: msg }); this._t = setTimeout(() => this.setState({ toast: '' }), 2600); }
  setF(k, v) { this.setState(s => ({ f: { ...s.f, [k]: v }, formError: '' })); }

  save(another) {
    const { f: draft, editingId, records } = this.state;
    const f = { ...draft, turma: draft.turma.trim(), disciplina: draft.disciplina.trim() };
    if (!f.date || !f.endDate || !f.turma || !f.disciplina || !f.aulas.length || !f.conteudo.trim()) {
      this.setState({ formError: 'Preencha semana, turma, disciplina, aula(s) e conteúdo trabalhado.' });
      return;
    }
    if (f.endDate < f.date) {
      this.setState({ formError: 'A data final deve ser igual ou posterior à data inicial.' });
      return;
    }
    let next;
    if (editingId) next = records.map(r => r.id === editingId ? { ...r, ...f } : r);
    else next = [{ id: Date.now(), ...f }, ...records];
    this.persist(next);
    const label = periodLabel(f.date, f.endDate) + ' · ' + f.turma;
    if (another) {
      this.setState({ records: next, f: { ...blank(), date: f.date, endDate: f.endDate, turma: f.turma, disciplina: f.disciplina }, formError: '' });
      window.scrollTo(0, 0);
      this.flash('Semanário salvo (' + label + '). Preencha o próximo.');
    } else {
      this.go('list', { records: next, editingId: null, f: blank() });
      this.flash(editingId ? 'Alterações salvas.' : 'Semanário salvo: ' + label);
    }
  }

  edit(id) {
    const r = this.state.records.find(x => x.id === id);
    if (!r) return;
    this.go('create', { editingId: id, f: { date: r.date, endDate: r.endDate || r.date, turma: r.turma, disciplina: r.disciplina, aulas: [...r.aulas], paginas: r.paginas || '', conteudo: r.conteudo, tarefa: r.tarefa, obs: r.obs }, formError: '' });
  }

  saveCoord(id, event) {
    event.preventDefault();
    if (!this.state.coordinator) return;
    const coordObservation = String(new FormData(event.currentTarget).get('note') || '').trim();
    const records = this.state.records.map(record => record.id === id ? { ...record, coordObservation } : record);
    this.persist(records);
    this.setState({ records });
    this.flash('Observação da coordenação atualizada.');
  }

  filtered() {
    const { records, flt } = this.state;
    return records.filter(r => (!flt.turma || r.turma === flt.turma) && (!flt.disciplina || r.disciplina === flt.disciplina) && (!flt.from || (r.endDate || r.date) >= flt.from) && (!flt.to || r.date <= flt.to)).sort(sortDesc);
  }

  renderVals() {
    const s = this.state;
    const hour = new Date().getHours();
    const val = fn => e => fn(e.target.value);
    const filtered = this.filtered();
    const filterOptions = field => [...new Set(s.records.map(record => record[field]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
    const sel = new Set(s.selected);
    const selInView = filtered.filter(r => sel.has(r.id)).length;
    const allOn = filtered.length > 0 && selInView === filtered.length;
    const box = on => ({ border: on ? 'var(--color-accent)' : 'var(--color-neutral-500)', bg: on ? 'var(--color-accent)' : 'transparent', mark: on ? '✓' : '' });

    const printRecs = s.records.filter(r => s.printIds.includes(r.id)).sort((a, b) => a.date.localeCompare(b.date) || Math.min(...a.aulas) - Math.min(...b.aulas)).map(deco);
    const uniq = k => [...new Set(printRecs.map(r => r[k]))];
    const tU = uniq('turma'), dU = uniq('disciplina');
    const lastPrintDate = printRecs.reduce((last, r) => (r.endDate || r.date) > last ? (r.endDate || r.date) : last, '');
    const multi = tU.length > 1 || dU.length > 1;
    const pm = {
      turma: tU.join(', ') || '—', disciplina: dU.join(', ') || '—',
      periodo: printRecs.length ? periodLabel(printRecs[0].date, lastPrintDate) : '—',
    };
    const openRec = s.openId ? s.records.find(r => r.id === s.openId) : null;
    const td = dp(TODAY);
    const hasFilters = !!(s.flt.turma || s.flt.disciplina || s.flt.from || s.flt.to);
    const setFlt = k => val(v => this.setState(st => ({ flt: { ...st.flt, [k]: v } })));
    const nSel = s.selected.length;
    const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
    const splashL = Math.max((vw - 1120) / 2, 0) + Math.min(Math.max(16, vw * 0.04), 40);

    return {
      hasSplash: !!s.splash, headerLogoOp: s.splash ? 0 : 1,
      splashFx: s.splash === 'fly' ? 0 : 1,
      riseName: s.rise ? 'riseIn' : 'none',
      loginOp: s.splash ? 0 : 1, loginBlur: s.splash ? '8px' : '0px', loginY: s.splash ? '-14px' : '0px',
      splashBg: s.splash === 'fly' ? 'transparent' : 'var(--color-bg)',
      splashPE: s.splash === 'fly' ? 'none' : 'auto',
      splashLeft: s.splash === 'fly' ? splashL + 'px' : '50%',
      splashTop: s.splash === 'fly' ? '32px' : '50%',
      splashH: s.splash === 'fly' ? '44px' : '120px',
      splashTf: s.splash === 'fly' ? 'translate(0,-50%)' : 'translate(-50%,-50%)',
      isLogin: s.screen === 'login', notLogin: s.screen !== 'login',
      isCoordinator: s.coordinator,
      isTeacher: !s.coordinator,
      listTitle: s.coordinator ? 'Coordenação e Direção' : 'Semanários salvos',
      isHome: s.screen === 'home', isCreate: s.screen === 'create', isList: s.screen === 'list', isPrint: s.screen === 'print',
      email: s.email, password: s.password, loginError: s.loginError,
      onEmail: val(v => this.setState({ email: v, loginError: '' })),
      onPassword: val(v => this.setState({ password: v, loginError: '' })),
      onLogin: e => {
        e.preventDefault();
        if (!s.email.includes('@') || !s.password) {
          this.setState({ loginError: 'Informe um e-mail válido e a senha.' });
          return;
        }
        const coordinator = s.email.trim().toLowerCase() === COORD_EMAIL;
        if (coordinator) {
          if (s.password !== COORD_PASSWORD) {
            this.setState({ loginError: 'Senha de teste incorreta.' });
            return;
          }
          this.go('list', { coordinator: true });
          return;
        }
        if (s.splash) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.go('home');
          return;
        }
        this.setState({ splash: 'center', rise: false });
        setTimeout(() => this.go('home', { splash: 'fly', rise: true }), 700);
        this._splashEnd = setTimeout(() => this.setState({ splash: '' }), 1500);
        this._riseEnd = setTimeout(() => this.setState({ rise: false }), 2300);
      },
      logout: () => {
        clearTimeout(this._splashEnd);
        clearTimeout(this._riseEnd);
        this.go('login', { password: '', coordinator: false, splash: '', rise: false, selected: [] });
      },
      goHome: () => this.go(s.coordinator ? 'list' : 'home'),
      goCreate: () => this.go('create', { editingId: null, f: blank(), formError: '' }),
      goList: () => this.go('list'),
      listNavBg: s.screen === 'list' ? 'var(--color-neutral-200)' : 'transparent',

      teacherName: 'Profª ' + TEACHER, teacherFirst: 'Ana Beatriz',
      greetOnEntry: s.rise ? "yes" : "no",
      greeting: hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite',
      todayLabel: WD[td.getDay()] + ', ' + td.getDate() + ' de ' + MO[td.getMonth()],
      todayShort: fmt(TODAY),
      totalCount: s.records.length,
      recent: [...s.records].sort(sortDesc).slice(0, 4).map(deco).map((r, i) => ({ ...r, riseDelay: (120 + i * 60) + 'ms', tarefaHint: r.tarefa ? ' · com tarefa de casa' : '', open: () => this.setState({ openId: r.id }) })),

      f: s.f, turmas: filterOptions('turma'), disciplinas: filterOptions('disciplina'),
      formTitle: s.editingId ? 'Editar semanário' : 'Criar semanário',
      saveLabel: s.editingId ? 'Salvar alterações' : 'Salvar semanário',
      notEditing: !s.editingId, formError: s.formError,
      setWeek: val(v => this.setF('date', v)),
      setWeekEnd: val(v => this.setF('endDate', v)), setTurma: val(v => this.setF('turma', v)), setDisciplina: val(v => this.setF('disciplina', v)),
      setPaginas: val(v => this.setF('paginas', v)), setConteudo: val(v => this.setF('conteudo', v)), setTarefa: val(v => this.setF('tarefa', v)), setObs: val(v => this.setF('obs', v)),
      aulaChips: [1, 2, 3, 4, 5, 6].map(n => { const on = s.f.aulas.includes(n); return { label: n + 'ª aula', on, border: on ? 'var(--color-accent)' : 'var(--color-divider)', bg: on ? 'var(--color-accent)' : 'var(--color-surface)', fg: on ? 'var(--color-bg)' : 'var(--color-text)', toggle: () => this.setF('aulas', on ? s.f.aulas.filter(x => x !== n) : [...s.f.aulas, n]) }; }),
      aulasPreview: s.f.aulas.length ? 'Selecionado: ' + aulasLabel(s.f.aulas) : '',
      onSave: e => { e.preventDefault(); this.save(false); },
      onSaveAnother: () => this.save(true),
      onCancel: () => this.go(s.editingId ? 'list' : 'home', { editingId: null, f: blank(), formError: '' }),

      flt: s.flt, fTurma: setFlt('turma'), fDisc: setFlt('disciplina'), fFrom: setFlt('from'), fTo: setFlt('to'),
      hasFilters, clearFilters: () => this.setState({ flt: { turma: '', disciplina: '', from: '', to: '' } }),
      filteredCount: filtered.length, noRows: filtered.length === 0,
      allBox: box(allOn),
      toggleAll: () => this.setState(st => { const ids = filtered.map(r => r.id); return { selected: allOn ? st.selected.filter(id => !ids.includes(id)) : [...new Set([...st.selected, ...ids])] }; }),
      selectedLabel: nSel ? nSel + (nSel === 1 ? ' selecionado' : ' selecionados') : 'Nenhum selecionado',
      noSelection: nSel === 0, printOpacity: nSel ? 1 : 0.45,
      goPrint: () => { if (nSel) this.go('print', { printIds: [...s.selected] }); },
      rows: filtered.map(deco).map(r => { const on = sel.has(r.id); const b = box(on); return { ...r, coordObservation: r.coordObservation || '', saveCoord: e => this.saveCoord(r.id, e), mark: b.mark, boxBorder: b.border, boxBg: b.bg, rowBg: on ? 'var(--color-accent-100)' : 'var(--color-surface)', rowRing: on ? 'inset 0 0 0 1px var(--color-accent-300)' : 'none', toggle: () => this.setState(st => ({ selected: on ? st.selected.filter(x => x !== r.id) : [...st.selected, r.id] })), open: () => this.setState({ openId: r.id }), edit: () => this.edit(r.id) }; }),

      printRows: printRecs.map(r => ({ ...r, showMeta: multi })), printCount: printRecs.length, pm,
      printFormat: s.printFormat,
      setPrintFormat: val(printFormat => this.setState({ printFormat })),
      groupedPrint: s.printFormat === 'weekly' || s.printFormat === 'monthly',
      compactPrint: s.printFormat === 'compact',
      boxesPrint: s.printFormat === 'boxes',
      detailedPrint: s.printFormat === 'detailed',
      printOrientation: s.printFormat === 'compact' ? 'paisagem' : 'retrato',
      printGroups: groupPrintRecords(printRecs, s.printFormat === 'monthly'),
      doPrint: () => window.print(),

      hasOpen: !!openRec, o: openRec ? deco(openRec) : {},
      closeOpen: () => this.setState({ openId: null }),
      stop: e => e.stopPropagation(),
      editOpen: () => this.edit(s.openId),
      printOpen: () => this.go('print', { printIds: [s.openId] }),
      toast: s.toast,
    };
  }
}
