/**
 * Dataset extraído do catálogo digital `catalogo-oxi-mercado.html`.
 * Cada produto: { sku, name, category, rev (preço de revenda), market (preço médio mercado),
 *                 use, description, tags, peso_kg (estimado), volume_m3 (estimado) }
 *
 * Estimativa de peso/volume:
 *   1L  ≈ 1.05 kg ≈ 0.0011 m³
 *   2L  ≈ 2.10 kg ≈ 0.0022 m³
 *   5L  ≈ 5.20 kg ≈ 0.0060 m³
 *   400g ≈ 0.42 kg ≈ 0.0006 m³
 *   800g ≈ 0.85 kg ≈ 0.0011 m³
 *   1.6kg ≈ 1.65 kg ≈ 0.0020 m³
 *   4kg  ≈ 4.10 kg ≈ 0.0050 m³
 *   500ml ≈ 0.55 kg ≈ 0.0006 m³
 */

function inferPesoVolume(name) {
  const n = name.toLowerCase()
  if (n.includes('5l') || n.includes('5 l') || n.includes('4kg')) return { peso: 5.2, volume: 0.006 }
  if (n.includes('2l') || n.includes('1,6kg')) return { peso: 2.1, volume: 0.0022 }
  if (n.includes('1l') || n.includes('1 l') || n.includes('800g')) return { peso: 1.05, volume: 0.0011 }
  if (n.includes('500ml') || n.includes('400g')) return { peso: 0.55, volume: 0.0006 }
  return { peso: 1.0, volume: 0.001 } // default
}

/* Regras de margem por categoria — espelha o catálogo digital catalogo-oxi-mercado.html.
   Margem = % aplicado sobre o preço de revenda pra obter o preço sugerido de venda. */
const MARGIN_RULES = {
  'Automotivo': {
    default: 80,
    rules: { 'agua': 70, 'car': 80, 'car plus': 85, 'flu': 90, 'limpneu': 85, 'pan': 75, 'pan plus': 80, 'sil': 85, 'alumen': 75, 'ativado': 80 }
  },
  'Casa & Construção': {
    default: 75,
    rules: { 'clean': 80, 'clor': 70, 'detergente neutro': 70, 'hipoclor': 65, 'liquid': 70, 'lp': 80, 'multlimp': 70, 'pine': 80, 'pos obra': 85, 'aquafloc': 90, 'limpa canil': 80 }
  },
  'Hospitalar': {
    default: 95,
    rules: { 'cloroxi': 90, 'enzime': 100, 'clean': 90, 'clor': 85, 'liquid': 85 }
  },
  'Corporativo': {
    default: 75,
    rules: { 'clean': 80, 'clor': 70, 'hipoclor': 65, 'liquid': 70, 'lp': 80, 'pine': 80, 'pos obra': 85, 'multlimp': 70, 'detergente neutro': 70 }
  },
  'Ind. Alimentícia & Agro': {
    default: 85,
    rules: { 'acid': 90, 'alcalino': 95, 'alcalino foamy': 85, 'caustic': 90, 'clor': 80, 'deterfood': 85, 'detergente neutro': 75, 'hipoclor': 70, 'liquid': 75, 'liquid pronto': 80, 'lub': 80, 'pan': 75, 'peracetic': 70, 'pine': 80, 'sanit': 95 }
  },
  'Doméstico': {
    default: 70,
    rules: { 'agua sanitaria': 60, 'lava louças': 65, 'detergente lava': 65, 'lava roupas 400': 80, 'lava roupas 800': 80, 'lava roupas 1': 75, 'lava roupas 4': 70, 'multlimp': 65, 'desinfetante': 70, 'amaciante': 75 }
  }
}

export function getMargin(cat, name) {
  const r = MARGIN_RULES[cat] || { default: 70, rules: {} }
  const n = (name || '').toLowerCase()
  for (const [key, val] of Object.entries(r.rules)) {
    if (n.includes(key)) return val
  }
  return r.default
}

/* Preço sugerido de venda = revenda * (1 + margem%) */
export function calcSuggestedSalePrice(rev, cat, name) {
  const mg = getMargin(cat, name)
  return +(rev * (1 + mg / 100)).toFixed(2)
}

const RAW = [
  // AUTOMOTIVO
  {c:"4147",n:"OXI Água Desmineralizada 1L",cat:"Automotivo",rev:2.90,mkt:8.90,use:"Radiador, bateria e ferro de passar",desc:"Água pura sem minerais para radiadores, baterias e ferros de passar. Evita ferrugem e acúmulo de sujeira nos equipamentos.",tags:["Radiador","Bateria"]},
  {c:"4146",n:"OXI Água Desmineralizada 5L",cat:"Automotivo",rev:12.71,mkt:32.90,use:"Radiador e bateria — econômico",desc:"Mesma água pura em embalagem de 5L. Ideal para oficinas e lava-rápidos que usam diariamente.",tags:["Oficina","Econômico"]},
  {c:"1416",n:"OXI Alumen Desincrustante Ácido 5L",cat:"Automotivo",rev:37.40,mkt:89.90,use:"Remove crostas de rodas e peças metálicas",desc:"Dissolve crostas de sujeira, ferrugem e manchas pesadas de rodas de alumínio e peças metálicas. Diluir 1:10 a 1:5 conforme sujeira.",tags:["Rodas","Ferrugem","Pesado"]},
  {c:"1413",n:"OXI Ativado Plus Desincrustante Ácido 5L",cat:"Automotivo",rev:65.07,mkt:149.90,use:"Limpeza pesada de peças industriais",desc:"Desincrustante ácido profissional para metalúrgicas e oficinas. Remove ferrugem e depósitos minerais.",tags:["Metalurgia","Industrial"]},
  {c:"2965",n:"OXI Car Detergente Neutro 1L",cat:"Automotivo",rev:8.18,mkt:19.90,use:"Lavar carros sem danificar a pintura",desc:"Detergente neutro automotivo que não agride a pintura. Diluição até 1:15 manual, 1:20 na máquina.",tags:["Lava-Jato","Pintura","Neutro"]},
  {c:"1420",n:"OXI Car Detergente Neutro 5L",cat:"Automotivo",rev:37.91,mkt:79.90,use:"Lavar carros — para lava-rápidos",desc:"Embalagem econômica de 5L. Não mancha, não risca, preserva a pintura. Rendimento alto.",tags:["Lava-Rápido","Econômico"]},
  {c:"3313",n:"OXI Car Plus com Cera 1L",cat:"Automotivo",rev:15.45,mkt:34.90,use:"Lava e encera o carro ao mesmo tempo",desc:"Detergente com cera que limpa e dá brilho numa só aplicação. Cria camada protetora.",tags:["Cera","Brilho","2 em 1"]},
  {c:"3312",n:"OXI Car Plus com Cera 5L",cat:"Automotivo",rev:62.10,mkt:129.90,use:"Lava e encera — econômico para lava-jatos",desc:"Versão 5L do Car Plus com cera. Perfeito para lava-jatos premium.",tags:["Lava-Jato","Premium"]},
  {c:"4460",n:"OXI Flu Solução Arrefecedora 1L",cat:"Automotivo",rev:11.24,mkt:29.90,use:"Protege radiador contra ferrugem e superaquecimento",desc:"Protege o sistema de arrefecimento contra corrosão e superaquecimento. Compatível com a maioria dos veículos.",tags:["Radiador","Motor","Proteção"]},
  {c:"4461",n:"OXI Flu Solução Arrefecedora 5L",cat:"Automotivo",rev:54.40,mkt:119.90,use:"Proteção do radiador — para oficinas e frotas",desc:"Embalagem 5L para oficinas mecânicas e frotas.",tags:["Oficina","Frota"]},
  {c:"1424",n:"OXI Limpneu Pretinho 1L",cat:"Automotivo",rev:15.16,mkt:32.90,use:"Deixa pneus pretos e brilhantes",desc:"Pretinho líquido que devolve cor e brilho dos pneus, tapetes e para-choques.",tags:["Pneu","Brilho","Estética"]},
  {c:"1425",n:"OXI Limpneu Pretinho 5L",cat:"Automotivo",rev:55.57,mkt:109.90,use:"Pretinho para pneus — econômico",desc:"Embalagem 5L para lava-jatos e estéticas automotivas.",tags:["Lava-Jato","Econômico"]},
  {c:"1432",n:"OXI Pan Desengraxante Alcalino 5L",cat:"Automotivo",rev:33.34,mkt:74.90,use:"Remove graxa pesada de motores e peças",desc:"Desengraxante alcalino de média espumação. Diluir 1:10 a 1:50.",tags:["Graxa","Motor"]},
  {c:"1428",n:"OXI Pan Plus Desincrustante 5L",cat:"Automotivo",rev:45.47,mkt:99.90,use:"Remove sujeira incrustada de peças e rodas",desc:"Alta eficiência contra graxas e resíduos grudados. Não usar sobre pintura.",tags:["Desincrustante","Peças"]},
  {c:"1435",n:"OXI Sil Silicone Líquido 1L",cat:"Automotivo",rev:39.11,mkt:79.90,use:"Renova plásticos e borrachas do carro",desc:"Silicone perfumado que protege e renova painel, para-choques e acabamentos.",tags:["Painel","Silicone","Brilho"]},

  // CASA & CONSTRUÇÃO
  {c:"4114",n:"OXI Clean Limpador 1L",cat:"Casa & Construção",rev:26.12,mkt:59.9,use:"Limpa, alveja e aromatiza sem cloro",desc:"Limpador à base de Peróxido de Hidrogênio. Sem cloro, não mancha superfícies coloridas.",tags:["Multiuso","Sem Cloro"]},
  {c:"3871",n:"OXI Clean Limpador 5L",cat:"Casa & Construção",rev:74.43,mkt:149.9,use:"Limpa e alveja — econômico",desc:"Fórmula do Clean 1L na embalagem de 5L.",tags:["Condomínio","Econômico"]},
  {c:"1397",n:"OXI Clor Desinfetante 5L",cat:"Casa & Construção",rev:28.91,mkt:59.9,use:"Desinfeta pisos, banheiros e cozinhas",desc:"Desinfetante à base de hipoclorito de sódio.",tags:["Desinfetante","Hipoclorito"]},
  {c:"4175",n:"OXI Detergente Neutro Concentrado 5L",cat:"Casa & Construção",rev:24.85,mkt:49.9,use:"Lava louças com rendimento superior",desc:"Detergente Oxi + Espuma concentrado. Rende muito mais que detergente comum.",tags:["Concentrado","Louças"]},
  {c:"3018",n:"OXI Hipoclor Alvejante 1L",cat:"Casa & Construção",rev:4.97,mkt:12.9,use:"Alvejante para roupas e banheiros",desc:"Alvejante clorado para lixeiras, ralos, vasos, banheiros e azulejos.",tags:["Alvejante","Cloro"]},
  {c:"2927",n:"OXI Hipoclor Alvejante 2L",cat:"Casa & Construção",rev:9.93,mkt:24.9,use:"Alvejante clorado — 2L",desc:"Mesmo alvejante em embalagem de 2L.",tags:["Alvejante","Econômico"]},
  {c:"1388",n:"OXI Hipoclor Alvejante 5L",cat:"Casa & Construção",rev:23.77,mkt:54.9,use:"Alvejante para grandes áreas",desc:"Embalagem 5L para condomínios, escolas e igrejas.",tags:["Condomínio","Grande"]},
  {c:"1445",n:"OXI Liquid N Detergente Neutro 5L",cat:"Casa & Construção",rev:34.67,mkt:69.9,use:"Detergente neutro biodegradável versátil",desc:"Neutro concentrado biodegradável. Limpa inox, acrílico, vidro, porcelanato e PVC.",tags:["Neutro","Biodegradável"]},
  {c:"1443",n:"OXI LP Desincrustante Ácido 5L",cat:"Casa & Construção",rev:49.58,mkt:99.9,use:"Remove cimento, rejunte e manchas de obra",desc:"Para pedra São Tomé, pisos rústicos, tijolos e calçadas. Pós-obra.",tags:["Pós-Obra","Cimento"]},
  {c:"1449",n:"OXI Multlimp Limpador 5L",cat:"Casa & Construção",rev:39.55,mkt:69.9,use:"Multiuso para o dia a dia",desc:"Remove gordura, fuligem, poeira e sujeiras de pisos, banheiros, cozinhas.",tags:["Multiuso","Prático"]},
  {c:"4110",n:"OXI Pine 1L",cat:"Casa & Construção",rev:28.85,mkt:59.9,use:"Desengordurante potente com pinho",desc:"Desengordurante com óleo de pinho natural. Baixa alcalinidade = seguro.",tags:["Pinho","Gordura"]},
  {c:"4168",n:"OXI Pine 5L",cat:"Casa & Construção",rev:84.31,mkt:169.9,use:"Desengordurante pinho — econômico",desc:"Pine 5L para empresas de limpeza, condomínios e restaurantes.",tags:["Empresas","Econômico"]},
  {c:"4165",n:"OXI Pós Obras 5L",cat:"Casa & Construção",rev:71.71,mkt:149.9,use:"Limpa cimento, argamassa e tinta de obra",desc:"Dissolve resíduos de cimento, argamassa e carnaúba.",tags:["Obra","Cimento"]},
  {c:"1442",n:"OXI Aquafloc Limpador de Piscina 5L",cat:"Casa & Construção",rev:33.50,mkt:79.9,use:"Clareia e trata a água da piscina",desc:"Floculante e decantador que aglutina partículas em suspensão.",tags:["Piscina","Cristalina"]},
  {c:"4543",n:"OXI Limpa Canil 1L",cat:"Casa & Construção",rev:25.64,mkt:49.9,use:"Limpa e desinfeta canis e pet shops",desc:"Para ambientes com animais. Remove odores e desinfeta.",tags:["Canil","Pet Shop"]},

  // HOSPITALAR
  {c:"4145",n:"OXI Cloroxi 1% 1L",cat:"Hospitalar",rev:10.00,mkt:24.9,use:"Desinfetante hospitalar certificado",desc:"Desinfetante com 1% de cloro ativo estabilizado para hospitais e clínicas.",tags:["Hospital","Certificado"]},
  {c:"4161",n:"OXI Cloroxi 1% 5L",cat:"Hospitalar",rev:24.55,mkt:59.9,use:"Desinfetante hospitalar — econômico",desc:"Cloroxi 5L para hospitais, UBS e clínicas.",tags:["Hospital","Econômico"]},
  {c:"4253",n:"OXI Enzime 1L",cat:"Hospitalar",rev:32.55,mkt:74.9,use:"Limpa instrumentos cirúrgicos — 7 enzimas",desc:"Detergente multi-enzimático neutro com 7 enzimas. Para instrumentos cirúrgicos.",tags:["Cirúrgico","Enzimático"]},
  {c:"4254",n:"OXI Enzime 5L",cat:"Hospitalar",rev:161.32,mkt:389.9,use:"Multi-enzimático para CME e centros cirúrgicos",desc:"Enzime 5L para Centrais de Material Esterilizado.",tags:["CME","Hospital"]},
  {c:"4114h",n:"OXI Clean Hospitalar 1L",cat:"Hospitalar",rev:26.12,mkt:59.9,use:"Limpa e alveja sem cloro para hospitais",desc:"Limpador à base de Peróxido de Hidrogênio para ambientes hospitalares.",tags:["Sem Cloro","Hospital"]},
  {c:"3871h",n:"OXI Clean Hospitalar 5L",cat:"Hospitalar",rev:74.43,mkt:149.9,use:"Limpeza hospitalar sem cloro — 5L",desc:"Clean 5L para limpeza diária em hospitais.",tags:["Hospital","Econômico"]},
  {c:"1397h",n:"OXI Clor Desinfetante Hospitalar 5L",cat:"Hospitalar",rev:28.91,mkt:59.9,use:"Desinfetante para ambientes de saúde",desc:"Hipoclorito para hospitais, clínicas e postos de saúde.",tags:["Desinfetante","Clínica"]},
  {c:"1445h",n:"OXI Liquid N Hospitalar 5L",cat:"Hospitalar",rev:34.67,mkt:69.9,use:"Detergente neutro hospitalar biodegradável",desc:"Neutro biodegradável para limpeza geral em hospitais.",tags:["Neutro","Biodegradável"]},

  // CORPORATIVO
  {c:"4114c",n:"OXI Clean Corporativo 1L",cat:"Corporativo",rev:26.12,mkt:59.9,use:"Limpeza diária de escritórios",desc:"Multiuso que limpa, alveja e perfuma. Sem cloro.",tags:["Escritório","Multiuso"]},
  {c:"3871c",n:"OXI Clean Corporativo 5L",cat:"Corporativo",rev:74.43,mkt:149.9,use:"Limpeza corporativa — econômico",desc:"Clean 5L para facilities e condomínios comerciais.",tags:["Facilities","Comercial"]},
  {c:"1397c",n:"OXI Clor Corporativo 5L",cat:"Corporativo",rev:28.91,mkt:59.9,use:"Desinfeta banheiros e copas",desc:"Desinfetante para banheiros, copas e áreas comuns.",tags:["Banheiro","Copa"]},
  {c:"4175c",n:"OXI Detergente Concentrado Corp 5L",cat:"Corporativo",rev:24.85,mkt:49.9,use:"Detergente para copas corporativas",desc:"Concentrado para copas e cozinhas de empresas.",tags:["Copa","Concentrado"]},
  {c:"3018c",n:"OXI Hipoclor Corp 1L",cat:"Corporativo",rev:4.97,mkt:12.9,use:"Alvejante para banheiros corporativos",desc:"Alvejante clorado para vasos, ralos e lixeiras.",tags:["Alvejante","Banheiro"]},
  {c:"1388c",n:"OXI Hipoclor Corp 5L",cat:"Corporativo",rev:23.77,mkt:54.9,use:"Alvejante para grandes áreas",desc:"Embalagem econômica para shoppings, condomínios e prédios.",tags:["Shopping","Condomínio"]},
  {c:"1445c",n:"OXI Liquid N Corp 5L",cat:"Corporativo",rev:34.67,mkt:69.9,use:"Detergente neutro para pisos e equipamentos",desc:"Neutro biodegradável para pisos, azulejos e bancadas.",tags:["Pisos","Neutro"]},
  {c:"1443c",n:"OXI LP Corp 5L",cat:"Corporativo",rev:49.58,mkt:99.9,use:"Remove sujeira pesada de pisos",desc:"Desincrustante ácido para pisos rústicos e calçadas.",tags:["Pisos","Fábrica"]},
  {c:"1449c",n:"OXI Multlimp Corp 5L",cat:"Corporativo",rev:39.55,mkt:69.9,use:"Multiuso para empresas",desc:"Limpador versátil para escritórios e áreas de convivência.",tags:["Multiuso","Versátil"]},
  {c:"4110c",n:"OXI Pine Corp 1L",cat:"Corporativo",rev:28.85,mkt:59.9,use:"Desengordurante para cozinhas",desc:"Desengordurante com pinho para refeitórios e cozinhas corporativas.",tags:["Cozinha","Pinho"]},
  {c:"4168c",n:"OXI Pine Corp 5L",cat:"Corporativo",rev:84.31,mkt:169.9,use:"Desengordurante — grandes áreas",desc:"Pine 5L para facilities e limpeza terceirizada.",tags:["Facilities","Econômico"]},
  {c:"4165c",n:"OXI Pós Obras Corp 5L",cat:"Corporativo",rev:71.71,mkt:149.9,use:"Limpeza pós-reforma em prédios",desc:"Remove cimento, argamassa e tinta após obras corporativas.",tags:["Reforma","Prédios"]},

  // IND. ALIMENTÍCIA & AGRO
  {c:"1402",n:"OXI Acid Desincrustante 5L",cat:"Ind. Alimentícia & Agro",rev:56.76,mkt:139.9,use:"Limpa ordenhadeiras e tanques (CIP)",desc:"Desincrustante ácido para limpeza CIP de ordenhadeiras e tanques.",tags:["CIP","Laticínio"]},
  {c:"1405",n:"OXI Alcalino Clorado 5L",cat:"Ind. Alimentícia & Agro",rev:51.38,mkt:129.9,use:"Desinfeta equipamentos alimentícios (CIP)",desc:"Desinfetante alcalino clorado de baixa espumação para CIP.",tags:["CIP","Laticínio"]},
  {c:"4419",n:"OXI Alcalino Clorado Foamy 5L",cat:"Ind. Alimentícia & Agro",rev:149.88,mkt:349.9,use:"Espuma desinfetante para paredes e pisos",desc:"Alcalino clorado com formação de espuma para COP.",tags:["Espuma","Frigorífico"]},
  {c:"3688",n:"OXI Caustic Desincrustante 5L",cat:"Ind. Alimentícia & Agro",rev:62.89,mkt:149.9,use:"Remove gordura pesada de tanques (CIP)",desc:"Desincrustante de alta alcalinidade para CIP em laticínios e bebidas.",tags:["CIP","Gordura"]},
  {c:"1409",n:"OXI Deterfood Industrial 5L",cat:"Ind. Alimentícia & Agro",rev:66.24,mkt:149.9,use:"Desengraxante para frigoríficos e açougues",desc:"Detergente alcalino de alta espumação para frigoríficos e laticínios.",tags:["Frigorífico","Açougue"]},
  {c:"1397i",n:"OXI Clor Industrial 5L",cat:"Ind. Alimentícia & Agro",rev:28.91,mkt:59.9,use:"Desinfetante geral para indústrias",desc:"Hipoclorito para desinfecção em indústrias alimentícias.",tags:["Desinfetante","Indústria"]},
  {c:"4175i",n:"OXI Detergente Neutro Ind 5L",cat:"Ind. Alimentícia & Agro",rev:24.85,mkt:49.9,use:"Neutro para cozinhas industriais",desc:"Detergente concentrado para cozinhas industriais e restaurantes.",tags:["Cozinha","Restaurante"]},
  {c:"1388i",n:"OXI Hipoclor Ind 5L",cat:"Ind. Alimentícia & Agro",rev:23.77,mkt:54.9,use:"Sanitização de equipamentos",desc:"Alvejante clorado para sanitização de superfícies.",tags:["Sanitização","Alvejante"]},
  {c:"1445i",n:"OXI Liquid N Ind 5L",cat:"Ind. Alimentícia & Agro",rev:34.67,mkt:69.9,use:"Detergente neutro industrial",desc:"Neutro biodegradável para limpeza geral.",tags:["Neutro","Biodegradável"]},
  {c:"4597",n:"OXI Liquid N Pronto Uso 5L",cat:"Ind. Alimentícia & Agro",rev:15.38,mkt:34.9,use:"Detergente pronto, sem diluir",desc:"Versão pronto uso sem necessidade de diluição.",tags:["Pronto Uso","Prático"]},
  {c:"4187",n:"OXI Lub F 5L",cat:"Ind. Alimentícia & Agro",rev:100.19,mkt:229.9,use:"Lubrificante vegetal para frigoríficos",desc:"Óleo vegetal para esteiras e trilhos. Biodegradável e seguro.",tags:["Lubrificante","Frigorífico"]},
  {c:"1432i",n:"OXI Pan Ind 5L",cat:"Ind. Alimentícia & Agro",rev:33.34,mkt:74.9,use:"Desengraxante para equipamentos industriais",desc:"Alcalino para remoção de graxa em equipamentos industriais.",tags:["Desengraxante","Peças"]},
  {c:"3892",n:"OXI Peracetic 5L",cat:"Ind. Alimentícia & Agro",rev:215.65,mkt:449.9,use:"Desinfeta frutas, carnes e utensílios",desc:"Ácido Peracético 15% para desinfecção de carnes, frutas e utensílios.",tags:["Peracético","Alimentos"]},
  {c:"4168i",n:"OXI Pine Ind 5L",cat:"Ind. Alimentícia & Agro",rev:84.31,mkt:169.9,use:"Desengordurante para áreas de produção",desc:"Pine para áreas de produção alimentícia.",tags:["Desengordurante","Produção"]},
  {c:"3514",n:"OXI Sanit Desinfetante 5L",cat:"Ind. Alimentícia & Agro",rev:54.72,mkt:139.9,use:"Desinfetante para laticínios e ordenhadeiras",desc:"Hipoclorito de sódio para laticínios e frigoríficos.",tags:["Laticínio","CIP"]},

  // DOMÉSTICO
  {c:"1437",n:"OXI Água Sanitária 1L",cat:"Doméstico",rev:3.41,mkt:7.9,use:"Desinfeta e alveja roupas e casa",desc:"Essencial para desinfecção doméstica e alvejamento de roupas brancas.",tags:["Essencial","Casa"]},
  {c:"1438",n:"OXI Água Sanitária 2L",cat:"Doméstico",rev:6.48,mkt:14.9,use:"Água sanitária — família",desc:"Mesma fórmula em 2L. Mais economia.",tags:["Família","Diário"]},
  {c:"1439",n:"OXI Água Sanitária 5L",cat:"Doméstico",rev:12.31,mkt:24.9,use:"Água sanitária — super econômico",desc:"Embalagem grande para uso intenso ou revenda.",tags:["Econômico","Revenda"]},
  {c:"4225",n:"Detergente Lava Louças Neutro 500ml VIT",cat:"Doméstico",rev:1.89,mkt:4.49,use:"Lava louças do dia a dia",desc:"Detergente neutro para louças, talheres e panelas.",tags:["Louças","Suave"]},
  {c:"4226",n:"Detergente Lava Louças Cristal 500ml VIT",cat:"Doméstico",rev:1.92,mkt:4.49,use:"Lava louças transparente",desc:"Detergente cristal sem corantes.",tags:["Cristal","Sem Corante"]},
  {c:"3935",n:"OXI Lava Louças Maçã Concentrado 500ml",cat:"Doméstico",rev:2.71,mkt:5.9,use:"Lava louças concentrado com aroma de maçã",desc:"Concentrado com fragrância de maçã.",tags:["Maçã","Concentrado"]},
  {c:"3469",n:"OXI Lava Roupas em Pó 400g",cat:"Doméstico",rev:3.13,mkt:7.9,use:"Sabão em pó compacto",desc:"Sabão em pó para lavagem manual ou máquina.",tags:["Roupas","Compacto"]},
  {c:"3470",n:"OXI Lava Roupas em Pó 800g",cat:"Doméstico",rev:6.27,mkt:16.9,use:"Sabão em pó — tamanho médio",desc:"Embalagem de 800g com bom custo-benefício.",tags:["Roupas","Família"]},
  {c:"3471",n:"OXI Lava Roupas em Pó 1,6kg",cat:"Doméstico",rev:12.61,mkt:29.9,use:"Sabão em pó — família",desc:"Para famílias médias que lavam roupa semanalmente.",tags:["Roupas","Semanal"]},
  {c:"3472",n:"OXI Lava Roupas em Pó 4kg",cat:"Doméstico",rev:31.41,mkt:69.9,use:"Sabão em pó — super econômico",desc:"Embalagem grande de 4kg.",tags:["Roupas","Revenda"]},
  {c:"3005",n:"OXI Multlimp 500ml",cat:"Doméstico",rev:3.06,mkt:6.9,use:"Multiuso para casa",desc:"Remove gordura, poeira e sujeira.",tags:["Multiuso","Casa"]},
  {c:"4530",n:"Multlimp 500ml VIT",cat:"Doméstico",rev:3.56,mkt:7.9,use:"Multiuso linha VIT",desc:"Limpador multiuso da linha VIT.",tags:["Multiuso","VIT"]},
  {c:"4232",n:"OXI Desinfetante Lavanda 2L",cat:"Doméstico",rev:6.11,mkt:14.9,use:"Desinfetante perfumado — lavanda",desc:"Desinfetante com fragrância de lavanda.",tags:["Lavanda","Perfumado"]},
  {c:"4231",n:"OXI Desinfetante Lavanda 5L",cat:"Doméstico",rev:14.25,mkt:29.9,use:"Desinfetante lavanda — econômico",desc:"Lavanda em 5L para famílias ou revenda.",tags:["Lavanda","Revenda"]},
  {c:"4230",n:"OXI Desinfetante Eucalipto 2L",cat:"Doméstico",rev:6.20,mkt:14.9,use:"Desinfetante refrescante — eucalipto",desc:"Fragrância refrescante de eucalipto.",tags:["Eucalipto","Refrescante"]},
  {c:"4229",n:"OXI Desinfetante Eucalipto 5L",cat:"Doméstico",rev:14.34,mkt:29.9,use:"Desinfetante eucalipto — econômico",desc:"Eucalipto em 5L.",tags:["Eucalipto","Revenda"]},
  {c:"4228",n:"OXI Desinfetante Floral 2L",cat:"Doméstico",rev:6.30,mkt:14.9,use:"Desinfetante suave — floral",desc:"Fragrância floral suave.",tags:["Floral","Suave"]},
  {c:"4227",n:"OXI Desinfetante Floral 5L",cat:"Doméstico",rev:14.27,mkt:29.9,use:"Desinfetante floral — econômico",desc:"Floral 5L.",tags:["Floral","Revenda"]},
  {c:"4234",n:"OXI Desinfetante Pinho 2L",cat:"Doméstico",rev:7.02,mkt:16.9,use:"Desinfetante clássico — pinho",desc:"O clássico desinfetante com aroma de pinho.",tags:["Pinho","Clássico"]},
  {c:"4233",n:"OXI Desinfetante Pinho 5L",cat:"Doméstico",rev:16.15,mkt:34.9,use:"Desinfetante pinho — econômico",desc:"Pinho 5L.",tags:["Pinho","Condomínio"]},
  {c:"4224",n:"OXI Amaciante 2L",cat:"Doméstico",rev:9.08,mkt:19.9,use:"Roupas macias e perfumadas",desc:"Amaciante com microcápsulas de perfume.",tags:["Amaciante","Perfume"]},
  {c:"4223",n:"OXI Amaciante 5L",cat:"Doméstico",rev:18.73,mkt:39.9,use:"Amaciante — econômico para revenda",desc:"Amaciante 5L para famílias grandes ou revendedores.",tags:["Amaciante","Revenda"]}
]

export const PRODUCTS = RAW.map(p => {
  const { peso, volume } = inferPesoVolume(p.n)
  return {
    sku: p.c,
    name: p.n,
    category: p.cat,
    rev_price: p.rev,
    market_price: p.mkt,
    suggested_sale_price: calcSuggestedSalePrice(p.rev, p.cat, p.n),
    short_use: p.use,
    description: p.desc,
    tags: p.tags,
    peso_kg: peso,
    volume_m3: volume
  }
})

export const CATEGORIES = [
  { name: 'Automotivo', slug: 'automotivo', icon: '🚗', position: 1 },
  { name: 'Casa & Construção', slug: 'casa-construcao', icon: '🏠', position: 2 },
  { name: 'Hospitalar', slug: 'hospitalar', icon: '🏥', position: 3 },
  { name: 'Corporativo', slug: 'corporativo', icon: '🏢', position: 4 },
  { name: 'Ind. Alimentícia & Agro', slug: 'industrial-alimenticia-agro', icon: '🏭', position: 5 },
  { name: 'Doméstico', slug: 'domestico', icon: '🏡', position: 6 }
]

export const PRICE_TABLES = [
  { name: 'Tabela Próxima', slug: 'proxima', description: 'Sul de MG · frete grátis em rotas', distance_min_km: 0, distance_max_km: 100, minimum_order_value: 1000 },
  { name: 'Tabela Interior', slug: 'interior', description: 'Demais regiões · consulte frete', distance_min_km: 100, distance_max_km: 500, minimum_order_value: 1500 },
  { name: 'Tabela Atacado', slug: 'atacado', description: 'Volume grande · pedidos > R$ 5.000', distance_min_km: null, distance_max_km: null, minimum_order_value: 5000 }
]

export const PAYMENT_TERMS = [
  { label: 'À vista (PIX/dinheiro)', days: '0', position: 1 },
  { label: '20 dias', days: '20', position: 2 },
  { label: '30 dias', days: '30', position: 3 },
  { label: '20/30/40', days: '20,30,40', position: 4 },
  { label: '30/40/50', days: '30,40,50', position: 5 },
  { label: '30/45/60', days: '30,45,60', position: 6 },
  { label: '30/60/90', days: '30,60,90', position: 7 }
]
