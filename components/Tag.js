// Etiqueta colorida: fundo claro e texto escuro derivados da cor escolhida para a tag.
export const estiloTag = (cor = '#0F7E67') => ({
  background: `color-mix(in srgb, ${cor} 15%, #fff)`,
  color: `color-mix(in srgb, ${cor} 72%, #000)`,
  boxShadow: `inset 3px 0 0 ${cor}`,
  paddingLeft: 10,
});
export default function Tag({ t }) {
  if (!t) return null;
  return <span className="pill" style={estiloTag(t.cor)}>{t.nome}</span>;
}
