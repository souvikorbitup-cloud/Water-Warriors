import { StyleSheet } from "@react-pdf/renderer";

export const PDF_COLORS = {
  ink: "#202020",
  muted: "#5E5E5E",
  border: "#E5E5E5",
  pale: "#F2F2F2",
  green: "#215F30",
  lightGreen: "#EAF3E8",
  yellow: "#F1BB1B",
  primary: "#F1BB1B",
  secondary: "#FFEAAC",
  softYellow: "#FFF1C9",
  sheen: "#F7D87A",
  cream: "#FFF8E6",
  white: "#FFFFFF",
} as const;

/** Horizontal page padding. Full-bleed blocks use the negative of this. */
export const PAGE_PADDING_X = 38;

export const pdfStyles = StyleSheet.create({
  /* ---------- Page ---------- */
  page: {
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: PAGE_PADDING_X,
    backgroundColor: PDF_COLORS.white,
    color: PDF_COLORS.ink,
    fontSize: 9,
    lineHeight: 1.45,
  },
  contentTop: {
    paddingTop: 34,
  },
  bleed: {
    marginHorizontal: -PAGE_PADDING_X,
  },
  muted: {
    color: PDF_COLORS.muted,
  },
  smallText: {
    fontSize: 7.2,
    lineHeight: 1.5,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },
  sectionBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  /* ---------- Header ---------- */
  noticeBar: {
    marginHorizontal: -PAGE_PADDING_X,
    backgroundColor: PDF_COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: PAGE_PADDING_X,
    alignItems: "center",
  },
  noticeText: {
    fontSize: 5.2,
    lineHeight: 1.35,
    color: PDF_COLORS.ink,
    textAlign: "center",
  },
  brandRow: {
    marginHorizontal: -PAGE_PADDING_X,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 0.8,
    borderBottomColor: PDF_COLORS.border,
    marginBottom: 28,
  },
  brandMark: {
    width: 46,
    height: 38,
    objectFit: "contain",
  },

  /* ---------- Greeting ---------- */
  greeting: {
    fontSize: 27,
    lineHeight: 1.2,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 6,
  },
  thankYou: {
    fontSize: 8.5,
    textAlign: "center",
    color: PDF_COLORS.ink,
  },

  /* ---------- Map + stat cards ---------- */
  map: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    marginTop: 22,
    marginBottom: 14,
  },
  mapPlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.pale,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 14,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48.7%",
    height: 56,
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    // soft "shadow" approximation (react-pdf has no box-shadow)
    borderBottomWidth: 1.8,
    borderBottomColor: "#DCDCDC",
    borderRadius: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PDF_COLORS.white,
  },
  statIcon: {
    width: 32,
    height: 32,
    marginRight: 11,
  },
  statLabel: {
    fontSize: 7.2,
    color: PDF_COLORS.muted,
  },
  statValue: {
    fontSize: 15,
    lineHeight: 1.2,
    fontWeight: 700,
    marginTop: 2,
  },

  /* ---------- Potential (cream section) ---------- */
  potentialSection: {
    marginHorizontal: -PAGE_PADDING_X,
    marginTop: 24,
    paddingHorizontal: PAGE_PADDING_X,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: PDF_COLORS.cream,
  },
  potentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  potentialCol: {
    width: "48.7%",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  potentialDescription: {
    fontSize: 7.8,
    lineHeight: 1.55,
    color: PDF_COLORS.muted,
  },
  potentialPill: {
    backgroundColor: PDF_COLORS.primary,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    marginBottom: 9,
  },
  potentialSheen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "42%",
    backgroundColor: PDF_COLORS.sheen,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    borderTopLeftRadius: 34,
    borderBottomLeftRadius: 18,
  },
  potentialIcon: {
    width: 32,
    height: 32,
    marginRight: 9,
  },
  potentialLabel: {
    fontSize: 7,
    color: PDF_COLORS.ink,
  },
  potentialValue: {
    fontSize: 16.5,
    lineHeight: 1.2,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    marginTop: 1,
  },
  rainImage: {
    width: "100%",
    height: 176,
    objectFit: "cover",
    borderRadius: 8,
  },
  imageCaption: {
    fontSize: 6.6,
    lineHeight: 1.4,
    color: PDF_COLORS.muted,
    marginTop: 5,
  },
  divider: {
    borderTopWidth: 0.8,
    borderTopColor: PDF_COLORS.border,
    marginTop: 18,
    marginBottom: 18,
  },

  /* ---------- Impact ---------- */
  pageTitle: {
    fontSize: 14.5,
    fontWeight: 700,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  impactItem: {
    width: "23.6%",
  },
  impactCard: {
    marginTop: 15,
    backgroundColor: PDF_COLORS.softYellow,
    borderRadius: 8,
    paddingTop: 24,
    paddingBottom: 11,
    paddingHorizontal: 4,
    alignItems: "center",
    minHeight: 80,
  },
  impactIconWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  impactIcon: {
    width: 30,
    height: 30,
  },
  impactLabel: {
    fontSize: 6.8,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    textAlign: "center",
  },
  impactValue: {
    fontSize: 14,
    lineHeight: 1.2,
    fontWeight: 700,
    marginTop: 3,
    textAlign: "center",
  },
  impactNote: {
    fontSize: 6.6,
    color: PDF_COLORS.muted,
    marginTop: 2,
    textAlign: "center",
  },
  assumptionsBox: {
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  assumptionsText: {
    fontSize: 6.6,
    lineHeight: 1.6,
    color: PDF_COLORS.muted,
  },

  /* ---------- Recharge analysis ---------- */
  rechargeBanner: {
    marginHorizontal: -PAGE_PADDING_X,
    width: 595,
    height: 100,
    objectFit: "cover",
    marginTop: 24,
    marginBottom: 22,
  },
  rechargeTitle: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  rechargeIntro: {
    fontSize: 8.2,
    lineHeight: 1.6,
    color: PDF_COLORS.muted,
    marginBottom: 11,
  },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: PDF_COLORS.primary,
    paddingLeft: 8,
    marginBottom: 9,
  },
  quoteText: {
    fontSize: 7.8,
    lineHeight: 1.6,
    color: PDF_COLORS.muted,
  },

  /* ---------- Forecast ---------- */
  forecastSection: {
    marginHorizontal: -PAGE_PADDING_X,
    paddingHorizontal: PAGE_PADDING_X,
    paddingTop: 36,
    paddingBottom: 28,
    backgroundColor: PDF_COLORS.cream,
  },
  forecastTitle: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.25,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  periodPill: {
    alignSelf: "center",
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.white,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginTop: 9,
    marginBottom: 17,
  },
  periodText: {
    fontSize: 6.8,
    color: PDF_COLORS.muted,
  },
  table: {
    width: "100%",
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    borderRadius: 8,
    backgroundColor: PDF_COLORS.white,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.primary,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.white,
  },
  tableRowZebra: {
    backgroundColor: PDF_COLORS.pale,
  },
  tableRowHighlight: {
    backgroundColor: PDF_COLORS.secondary,
  },
  tableRowLast: {
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  cellBase: {
    paddingVertical: 8.5,
    paddingHorizontal: 14,
    fontSize: 8,
  },
  cellMonth: {
    width: "25%",
  },
  cellRainfall: {
    width: "36%",
  },
  cellPotential: {
    width: "39%",
  },
  cellDivider: {
    borderRightWidth: 0.8,
    borderRightColor: PDF_COLORS.border,
  },
  headerText: {
    fontSize: 8,
    fontWeight: 700,
    color: PDF_COLORS.ink,
  },
  boldText: {
    fontWeight: 700,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PDF_COLORS.primary,
    borderRadius: 7,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginTop: 14,
  },
  tipIcon: {
    width: 17,
    height: 17,
    marginRight: 11,
  },
  tipText: {
    flex: 1,
    fontSize: 7.6,
    lineHeight: 1.5,
    color: PDF_COLORS.ink,
  },
  noteBox: {
    borderWidth: 0.8,
    borderColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.white,
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  noteText: {
    fontSize: 6.6,
    lineHeight: 1.55,
    color: PDF_COLORS.muted,
  },
  noteSource: {
    fontSize: 6.6,
    lineHeight: 1.55,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    marginTop: 4,
  },

  /* ---------- Footer ---------- */
  footer: {
    position: "absolute",
    bottom: 17,
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    borderTopWidth: 0.6,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    color: PDF_COLORS.muted,
    fontSize: 7.5,
  },
});
