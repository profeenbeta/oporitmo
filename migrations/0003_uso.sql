-- Contador anónimo de visitas (sin PII). Solo se lee en /admin.
create table if not exists oporitmo_visita_dia (
  dia date not null primary key,
  visitas int not null default 0,
  visitantes int not null default 0
);

create table if not exists oporitmo_visitante_visto (
  dia date not null,
  visitante text not null,
  primary key (dia, visitante)
);
