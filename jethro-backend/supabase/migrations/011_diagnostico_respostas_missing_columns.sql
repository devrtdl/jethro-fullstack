-- Migration 011: adiciona colunas de resposta faltantes em diagnostico_respostas
-- As colunas Q5, Q6, Q7, Q8, Q9 e Q12 são usadas pelas regras do motor v2.4
-- para ativar os modelos A, B, C, F, G e H — mas não existiam como colunas
-- dedicadas, tornando a tabela inutilizável para auditoria.

alter table diagnostico_respostas
  add column if not exists q5_fase         text null,
  add column if not exists q6_conexao_dons text null,
  add column if not exists q7_proposito    text null,
  add column if not exists q8_estrutura    text null,
  add column if not exists q9_financeiro   text null,
  add column if not exists q12_lucro       text null;

comment on column diagnostico_respostas.q5_fase         is 'fase_negocio: A=Ideia B=Início C=Crescimento D=Consolidado';
comment on column diagnostico_respostas.q6_conexao_dons is 'conexao_dons: A=Sim B=Parcial C=Não';
comment on column diagnostico_respostas.q7_proposito    is 'proposito_negocio: A=Claro B=Ideia C=Sem clareza';
comment on column diagnostico_respostas.q8_estrutura    is 'estrutura_negocio: A=Sim B=Em dev. C=Não';
comment on column diagnostico_respostas.q9_financeiro   is 'organizacao_financeira: A=Estruturada B=Básica C=Desorganizada';
comment on column diagnostico_respostas.q12_lucro       is 'lucro_crescimento: A=Crescendo B=Estável C=Regredindo';
