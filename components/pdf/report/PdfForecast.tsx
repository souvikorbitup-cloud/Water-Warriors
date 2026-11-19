import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";

export default function PdfForecast({ data }: { data: WaterWarriorsPdfData }) {
  const { forecast } = data;
  const lastIndex = forecast.rows.length - 1;

  return (
    <View style={pdfStyles.forecastSection}>
      <PdfImage
        src={resolveAsset(data.assets, "gradient")}
        style={pdfStyles.sectionBg}
      />

      <Text style={pdfStyles.forecastTitle}>{forecast.title}</Text>
      <View style={pdfStyles.periodPill}>
        <Text style={pdfStyles.periodText}>{forecast.period}</Text>
      </View>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader} wrap={false}>
          <Text
            style={[
              pdfStyles.cellBase,
              pdfStyles.cellMonth,
              pdfStyles.headerText,
            ]}
          >
            {forecast.monthLabel}
          </Text>
          <Text
            style={[
              pdfStyles.cellBase,
              pdfStyles.cellRainfall,
              pdfStyles.headerText,
            ]}
          >
            {forecast.rainfallLabel}
          </Text>
          <Text
            style={[
              pdfStyles.cellBase,
              pdfStyles.cellPotential,
              pdfStyles.headerText,
            ]}
          >
            {forecast.potentialLabel}
          </Text>
        </View>

        {forecast.rows.length ? (
          forecast.rows.map((row, index) => {
            const bold = row.highlight ? pdfStyles.boldText : {};
            return (
              <View
                key={`${row.month}-${index}`}
                style={[
                  pdfStyles.tableRow,
                  index % 2 === 1 ? pdfStyles.tableRowZebra : {},
                  row.highlight ? pdfStyles.tableRowHighlight : {},
                  index === lastIndex ? pdfStyles.tableRowLast : {},
                ]}
                wrap={false}
              >
                <Text
                  style={[
                    pdfStyles.cellBase,
                    pdfStyles.cellMonth,
                    pdfStyles.cellDivider,
                    pdfStyles.boldText,
                  ]}
                >
                  {row.month}
                </Text>
                <Text
                  style={[
                    pdfStyles.cellBase,
                    pdfStyles.cellRainfall,
                    pdfStyles.cellDivider,
                    bold,
                  ]}
                >
                  {row.rainfall}
                </Text>
                <Text
                  style={[pdfStyles.cellBase, pdfStyles.cellPotential, bold]}
                >
                  {row.potential}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={[pdfStyles.tableRow, pdfStyles.tableRowLast]}>
            <Text style={[pdfStyles.cellBase, pdfStyles.muted]}>
              {forecast.pendingLabel}
            </Text>
          </View>
        )}
      </View>

      {/* <View style={pdfStyles.tipBox} wrap={false}>
        <PdfImage
          src={resolveAsset(data.assets, "bulb")}
          style={pdfStyles.tipIcon}
        />
        <Text style={pdfStyles.tipText}>{forecast.tip}</Text>
      </View> */}

      <View style={pdfStyles.noteBox} wrap={false}>
        <Text style={pdfStyles.noteText}>{forecast.note}</Text>
        <Text style={pdfStyles.noteSource}>{forecast.source}</Text>
      </View>

      <View style={pdfStyles.noteBox} wrap={false}>
        <Text style={pdfStyles.noteText}>{forecast.disclaimer}</Text>
      </View>
    </View>
  );
}
