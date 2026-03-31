-- Adiciona coluna palavra_intro na tabela diagnostic_messages
-- Armazena a frase introdutória espiritual que aparece antes do versículo (✦ PALAVRA PARA ESTE MOMENTO)
alter table diagnostic_messages
  add column if not exists palavra_intro text;
