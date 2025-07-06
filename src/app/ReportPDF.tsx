import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from '@react-pdf/renderer';

Font.register({
    family: 'NotoSansVar',
    src: '/fonts/NotoSans-Variable.ttf',
    fontWeight: 400,
});
Font.register({
    family: 'NotoSansVar',
    src: '/fonts/NotoSans-Variable.ttf',
    fontWeight: 700,
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 12,
        fontFamily: 'NotoSansVar',
        backgroundColor: '#f8fafc',
        color: '#222',
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 10,
    },
    date: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'NotoSansVar',
        fontWeight: 400,
    },
    reportTypeBubble: {
        alignSelf: 'center',
        backgroundColor: '#22c55e',
        color: '#fff',
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        fontSize: 14,
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 18,
        marginBottom: 18,
        textAlign: 'center',
        minWidth: 120,
    },
    hr: {
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
        marginVertical: 18,
        width: '100%',
        alignSelf: 'center',
    },
    preparedForSection: {
        backgroundColor: '#2563eb',
        paddingVertical: 18,
        marginBottom: 18,
        borderRadius: 10,
        width: '100%',
        alignSelf: 'center',
    },
    preparedForText: {
        color: '#fff',
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        fontSize: 16,
        textAlign: 'center',
        letterSpacing: 1,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        color: '#2563eb',
        marginTop: 24,
        marginBottom: 8,
        textAlign: 'left',
    },
    complianceHeader: {
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        color: '#222',
        marginTop: 18,
        marginBottom: 4,
        textAlign: 'left',
    },
    complianceText: {
        fontSize: 12,
        color: '#222',
        marginBottom: 18,
        textAlign: 'left',
        lineHeight: 1.5,
        fontFamily: 'NotoSansVar',
        fontWeight: 400,
    },
    summaryTable: {
        width: '100%',
        marginBottom: 18,
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: 'NotoSansVar',
    },
    summaryRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 6,
        paddingHorizontal: 2,
    },
    summaryLabel: {
        width: '40%',
        fontWeight: 700,
        fontFamily: 'NotoSansVar',
        color: '#374151',
        fontSize: 12,
    },
    summaryValue: {
        width: '60%',
        color: '#222',
        fontFamily: 'NotoSansVar',
        fontWeight: 400,
        fontSize: 12,
    },
    textBlock: {
        marginBottom: 12,
        lineHeight: 1.6,
        fontSize: 12,
        color: '#222',
        textAlign: 'left',
        fontFamily: 'NotoSansVar',
        fontWeight: 400,
    },
});

// Props type for all report fields
export interface ReportPDFProps {
    bankName: string;
    reportType: string;
    plotNumber: string;
    plotArea: string;
    coordinates: string;
    location: string;
    municipality: string;
    area: string;
    sheetPlan: string;
    registrationNo: string;
    propertyType: string;
    zone: string;
    zoneDescription: string;
    buildingCoefficient: string;
    coverage: string;
    floors: string;
    height: string;
    value2018: string;
    value2021: string;
    reportTitle: string;
    reportDate: string;
    introduction: string;
    plotDescription: string;
    findings: string;
    conclusion: string;
    plotImage?: string;
    mapImages?: { label: string; url: string }[];
}

const propertyRows = [
    { label: 'Plot Number', key: 'plotNumber' },
    { label: 'Plot Area', key: 'plotArea' },
    { label: 'Coordinates', key: 'coordinates' },
    { label: 'Location', key: 'location' },
    { label: 'Municipality', key: 'municipality' },
    { label: 'Area', key: 'area' },
    { label: 'Sheet/Plan', key: 'sheetPlan' },
    { label: 'Registration No', key: 'registrationNo' },
    { label: 'Property Type', key: 'propertyType' },
    { label: 'Zone', key: 'zone' },
    { label: 'Zone Description', key: 'zoneDescription' },
    { label: 'Building Coefficient', key: 'buildingCoefficient' },
    { label: 'Coverage', key: 'coverage' },
    { label: 'Floors', key: 'floors' },
    { label: 'Height', key: 'height' },
    { label: 'Value 2018', key: 'value2018' },
    { label: 'Value 2021', key: 'value2021' },
];

export const ReportPDF: React.FC<ReportPDFProps> = (props) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Title */}
            <Text style={styles.title}>{props.reportTitle}</Text>
            {/* Date */}
            <Text style={styles.date}>Generated on {props.reportDate}</Text>
            {/* Report Type Bubble */}
            <Text style={styles.reportTypeBubble}>{props.reportType}</Text>
            {/* Horizontal Line */}
            <View style={styles.hr} />
            {/* Prepared For Section */}
            <View style={styles.preparedForSection}>
                <Text style={styles.preparedForText}>Prepared for {props.bankName}</Text>
            </View>
            {/* Banking Compliance Section */}
            <Text style={styles.complianceHeader}>Banking Compliance</Text>
            <Text style={styles.complianceText}>
                This report has been prepared in accordance with {props.bankName} evaluation standards and Cyprus
                banking regulations for property assessment and valuation purposes.
            </Text>
            {/* Report Information Summary (Property Details) */}
            <Text style={styles.sectionHeader}>Report Information Summary</Text>
            <View style={styles.summaryTable}>
                {propertyRows.map(row => {
                    const value = props[row.key as keyof ReportPDFProps];
                    return (
                        <View style={styles.summaryRow} key={row.key}>
                            <Text style={styles.summaryLabel}>{row.label}:</Text>
                            <Text style={styles.summaryValue}>{typeof value === 'string' ? value : ''}</Text>
                        </View>
                    );
                })}
            </View>
            {/* Main Sections */}
            <Text style={styles.sectionHeader}>Introduction</Text>
            <Text style={styles.textBlock}>{props.introduction}</Text>
            <Text style={styles.sectionHeader}>Plot Description</Text>
            <Text style={styles.textBlock}>{props.plotDescription}</Text>
            {props.plotImage && (
                <View wrap={false} style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionHeader}>Plot Visualization</Text>
                    <Image src={props.plotImage} style={{ width: 300, height: 300, alignSelf: 'center', marginVertical: 8, border: '1px solid #888', backgroundColor: '#fff' }} />
                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>Area: {props.area}</Text>
                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>Muncipality: {props.municipality}</Text>
                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 2 }}>Plot boundary visualization extracted from PAL Surveying mapping system</Text>
                </View>
            )}
            {Array.isArray(props.mapImages) && props.mapImages.length > 0 && (
                <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 16 }}>Map Views</Text>
                    {props.mapImages.map(img => (
                        img && img.label && img.url ? (
                            <View key={img.label} style={{ alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>{String(img.label)}</Text>
                                <Image src={img.url} style={{ width: 300, height: 200, alignSelf: 'center', marginVertical: 4, border: '1px solid #888', backgroundColor: '#fff' }} />
                                <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 2 }}>Google Maps Static API view with plot perimeter overlay</Text>
                            </View>
                        ) : null
                    ))}
                </View>
            )}
            <Text style={styles.sectionHeader}>Findings</Text>
            <Text style={styles.textBlock}>{props.findings}</Text>
            <Text style={styles.sectionHeader}>Conclusion</Text>
            <Text style={styles.textBlock}>{props.conclusion}</Text>
        </Page>
    </Document>
);

export default ReportPDF; 