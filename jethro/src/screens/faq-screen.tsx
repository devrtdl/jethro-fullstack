import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { JethroColors } from '@/constants/theme';

type FaqItem = { q: string; a: string };
type FaqBlock = { title: string; items: FaqItem[] };

const BLOCOS: FaqBlock[] = [
  {
    title: 'Navegação e Primeiros Passos',
    items: [
      {
        q: 'Por onde devo começar?',
        a: 'Início — Sua central de comando. Aqui você acompanha a semana atual do seu plano, vê as ações em aberto, o devocional da semana e o status do Gate de Avanço.\n\nMentor — O seu mentor particular disponível 24 horas. Tire dúvidas sobre o seu plano, peça orientação e receba respostas baseadas no seu perfil e na sua semana atual.\n\nDevocional — A sua âncora espiritual semanal. Um versículo, uma aplicação para o negócio, uma pergunta de confronto e uma declaração para guiar a semana.\n\nBiblioteca — Os 14 guias técnicos do Método PBN — disponíveis desde o primeiro dia.\n\nPerfil — Gerencie sua conta, veja seu diagnóstico, acompanhe seu progresso e acesse estas perguntas frequentes.',
      },
      {
        q: 'Quanto tempo por semana preciso dedicar?',
        a: 'O plano foi desenhado para a realidade de quem já tem muito a fazer. A média é de 3 a 5 horas por semana — distribuídas como você preferir. O que não pode faltar: abrir a semana, ler o devocional e executar as ações antes do Gate. Consistência pequena e regular vale mais do que intensidade esporádica.',
      },
    ],
  },
  {
    title: 'Método e Funcionamento',
    items: [
      {
        q: 'O que é o diagnóstico?',
        a: 'O diagnóstico é a conversa que o Jethro precisa ter com você antes de qualquer coisa. Em poucos minutos, você responde perguntas sobre o momento real do seu negócio — não sobre teoria, não sobre o que deveria ser. A partir daí, o Jethro entende onde você está de verdade e constrói um plano feito para a sua situação, não para um empreendedor genérico.',
      },
      {
        q: 'O que é o Método PBN?',
        a: 'PBN significa Princípios Bíblicos para Negócios. É o método criado por Rogério Teixeira ao longo de anos mentorando empreendedores cristãos. Ele organiza o negócio em 7 Pilares — de Governo Pessoal a Legado — cada um fundamentado na Palavra de Deus e aplicado à realidade prática de quem empreende. O Jethro é o método PBN em formato de plano personalizado.',
      },
      {
        q: 'O que é o plano de 24 semanas?',
        a: 'É o seu roteiro de transformação dividido em 5 blocos: Fundamento, Estrutura, Controlo, Crescimento e Legado. Cada semana tem ações concretas construídas a partir do seu diagnóstico, uma âncora bíblica e um material técnico de referência. O plano avança semana a semana — você não pula etapas, porque cada fase constrói sobre a anterior.',
      },
      {
        q: 'O que é o Gate de Avanço?',
        a: 'O Gate de Avanço é o checkpoint de responsabilidade semanal. Antes de a próxima semana ser liberada, o Jethro verifica se as ações da semana atual foram concluídas. Cada semana tem 120 horas de prazo após ser aberta. Não é uma punição — é o mecanismo que garante que você execute o plano, e não apenas o leia.',
      },
      {
        q: 'O que é o Devocional Semanal?',
        a: 'O Devocional é a abertura espiritual de cada semana. Ele tem 4 elementos: um versículo alinhado ao desafio da semana, uma aplicação prática para o seu negócio, uma pergunta de confronto pessoal e uma declaração para guiar os próximos dias. Aparece antes das ações — porque um empreendedor cristão não separa o que faz de quem é.',
      },
      {
        q: 'O que são os materiais da Biblioteca?',
        a: 'São os 14 Guias Técnicos do Método PBN — resumos aprofundados de obras como Profit First, Hábitos Atômicos, Traction EOS, StoryBrand e outros, adaptados à realidade do empreendedor cristão. Todos disponíveis desde o primeiro dia. O Mentor indica o guia certo no momento certo do seu plano, mas você pode acessá-los a qualquer momento pela Biblioteca.',
      },
      {
        q: 'O Jethro funciona para qualquer tipo de negócio?',
        a: 'O Jethro foi construído para micro e pequenos empreendedores cristãos — de prestadores de serviço a comércios, de profissionais autônomos a pequenas empresas com equipe. O que importa não é o setor: é o empreendedor por trás do negócio. Se você tem um negócio real e quer crescer com propósito, o Jethro foi feito para você.',
      },
      {
        q: 'Preciso ter um negócio já funcionando para usar o Jethro?',
        a: 'Não necessariamente. Se você está no início — com uma ideia ou um negócio que ainda não saiu do papel — o Jethro tem um caminho específico para você. Se já tem um negócio funcionando, o plano começa exatamente onde você está. O diagnóstico identifica o seu ponto de partida real.',
      },
      {
        q: 'Preciso ser cristão para usar o Jethro?',
        a: 'O Jethro é um mentor cristão — o método, os versículos e a voz do Rogério carregam essa identidade sem pedir desculpas por isso. Se você é um empreendedor cristão que quer integrar fé e negócio, está no lugar certo. Se ainda está nessa jornada, também está. O Jethro não cobra perfeição — cobra compromisso.',
      },
      {
        q: 'Em quanto tempo vejo resultados?',
        a: 'Depende do ponto de partida — e o seu diagnóstico define isso. Os primeiros sinais aparecem nas semanas 4 a 6, quando a Fase de Fundação começa a criar clareza onde havia ruído. Resultados concretos de estrutura e crescimento aparecem entre os meses 2 e 4. O Jethro não promete atalhos — promete um caminho sólido, executado semana a semana.',
      },
      {
        q: 'O Jethro substitui um mentor ou consultor?',
        a: 'O Jethro não substitui — ele multiplica. Ele entrega o método, a estrutura e o acompanhamento que antes só eram acessíveis em mentorias de alto custo. Para empreendedores que chegam ao estágio de escala e querem mentoria individual com Rogério Teixeira, o Jethro é o ponto de partida natural — e esse caminho aparece no momento certo do seu plano.',
      },
      {
        q: 'Posso pular semanas ou refazer o diagnóstico?',
        a: 'Semanas não podem ser puladas — o plano é sequencial por estrutura, não por burocracia. Cada fase constrói sobre a anterior. Refazer o diagnóstico é possível a partir do 3º mês. Negócios evoluem, perfis mudam — a reclassificação é parte natural do processo de crescimento.',
      },
      {
        q: 'Qual tradução bíblica o Jethro usa?',
        a: 'O Jethro usa a NVI — Nova Versão Internacional — como padrão em toda a plataforma. Em algumas âncoras específicas do plano, podem aparecer versões tradicionais preservadas por Rogério Teixeira na construção do Método PBN.',
      },
    ],
  },
  {
    title: 'Conta e Suporte',
    items: [
      {
        q: 'O que acontece se eu pausar ou cancelar a assinatura?',
        a: 'Se pausar, o seu plano fica salvo exatamente onde você parou — semana, ações e histórico. Se cancelar, o acesso encerra no fim do período pago. Se retornar, recomeça da semana em que estava. O seu progresso não é perdido.',
      },
      {
        q: 'Não recebi notificação / meu Gate não abriu. O que faço?',
        a: 'Primeiro, verifique se as notificações do Jethro estão ativas nas configurações do seu celular. Se o Gate não abriu após concluir as ações da semana, feche e reabra o app. Se o problema persistir, fale com a nossa equipe de suporte — respondemos em até 24 horas em dias úteis, das 9h às 18h, horário de Brasília (UTC-3).\n\nE-mail: suporte@jethroapp.com\nWhatsApp: +55 21 98091-1540',
      },
      {
        q: 'Como atualizo meus dados ou troco meu e-mail?',
        a: 'Acesse Perfil > ícone de edição no canto superior direito. Lá você atualiza nome, e-mail e preferências de notificação. Para alterações de plano ou pagamento, acesse Preferências de Assinatura dentro do Perfil.',
      },
      {
        q: 'Não consigo fazer login. O que faço?',
        a: "Tente a opção 'Esqueci minha senha' na tela de acesso — você receberá um link por e-mail em até 5 minutos. Verifique também a pasta de spam. Se o problema persistir, entre em contato com o suporte.\n\nE-mail: suporte@jethroapp.com\nWhatsApp: +55 21 98091-1540",
      },
      {
        q: 'Tive um problema com meu pagamento. Como resolvo?',
        a: 'Pagamentos são processados de forma segura pela loja do seu celular (App Store ou Google Play). Se você tentou resolver pela loja e o problema não foi solucionado, entre em contato com o nosso suporte — respondemos em até 24 horas em dias úteis, das 9h às 18h, horário de Brasília (UTC-3).\n\nE-mail: suporte@jethroapp.com\nWhatsApp: +55 21 98091-1540',
      },
      {
        q: 'Como falo com o suporte do Jethro?',
        a: 'A equipe do Jethro está disponível por dois canais. Respondemos em até 24 horas em dias úteis, no horário comercial do Brasil (9h às 18h, horário de Brasília, UTC-3).\n\nE-mail: suporte@jethroapp.com\nWhatsApp: +55 21 98091-1540\n\nPara dúvidas sobre o método, o plano ou o seu diagnóstico, o Mentor dentro do app responde a qualquer hora.',
      },
    ],
  },
];

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.item}>
      <Pressable
        style={styles.itemHeader}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.itemQuestion}>{item.q}</Text>
        <Text style={[styles.itemChevron, open && styles.itemChevronOpen]}>
          {open ? '−' : '+'}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.itemBody}>
          <Text style={styles.itemAnswer}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

export function FaqScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Perguntas Frequentes</Text>
        </View>

        {BLOCOS.map((bloco) => (
          <View key={bloco.title} style={styles.block}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>{bloco.title.toUpperCase()}</Text>
            </View>
            {bloco.items.map((item) => (
              <AccordionItem key={item.q} item={item} />
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: JethroColors.navy,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: JethroColors.gold,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: JethroColors.creme,
  },
  block: {
    marginBottom: 28,
  },
  blockHeader: {
    backgroundColor: JethroColors.gold,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: JethroColors.navy,
    letterSpacing: 1,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: JethroColors.navySurface,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  itemQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: JethroColors.creme,
    lineHeight: 22,
  },
  itemChevron: {
    fontSize: 20,
    color: JethroColors.gold,
    fontWeight: '400',
    width: 24,
    textAlign: 'center',
  },
  itemChevronOpen: {
    color: JethroColors.goldMuted,
  },
  itemBody: {
    paddingBottom: 16,
  },
  itemAnswer: {
    fontSize: 14,
    color: JethroColors.muted,
    lineHeight: 22,
  },
});
