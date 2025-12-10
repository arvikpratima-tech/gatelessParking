import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column } from '@react-email/components'
import React from 'react'

interface FireAlertEmailTemplateProps {
    address: string,
    zoneName?: string,
    plate?: string,
    vehicleColor?: string,
    vehicleType?: string,
    fires: Array<{
        label: string;
        score: number;
    }>,
    timestamp: string,
    cameraId?: string,
    locationId?: string
}

function FireAlertEmailTemplate(props: FireAlertEmailTemplateProps) {
    const {
        address,
        zoneName,
        plate,
        vehicleColor,
        vehicleType,
        fires,
        timestamp,
        cameraId,
        locationId
    } = props

    const fireLabels = fires.map(f => f.label).join(', ')
    const highestConfidence = Math.max(...fires.map(f => f.score))
    const severity = highestConfidence > 0.8 ? 'CRITICAL' : highestConfidence > 0.5 ? 'HIGH' : 'MEDIUM'

    return (
        <Html>
            <Head />
            <Preview>🚨 FIRE DETECTED - Immediate action required</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading as="h1" 
                        style={{ fontSize: '36px', lineHeight: 1.3, color: "#d32f2f", fontWeight: 700, textAlign: "center" }}
                    >
                        🚨 FIRE DETECTED
                    </Heading>
                    <Hr />
                    
                    <Section style={alertBox}>
                        <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '10px', textAlign: 'center' }}>
                            URGENT: Fire Detection Alert
                        </Text>
                        <Text style={{ fontSize: '18px', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                            Severity: {severity}
                        </Text>
                    </Section>

                    <Text style={{ fontSize: '22px', padding: '20px', lineHeight: 1.3, color: "#808080" }}>
                        Fire has been detected in the parking area. Immediate action is required.
                    </Text>

                    <Section style={track.container}>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Location:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{zoneName || address}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Address:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{address}</Text>
                            </Column>
                        </Row>
                        {plate && (
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Vehicle Plate:</Text>
                                </Column>
                                <Column align="right">
                                    <Text style={{ fontSize: '18px', textTransform: 'uppercase' }}>{plate}</Text>
                                </Column>
                            </Row>
                        )}
                        {(vehicleColor || vehicleType) && (
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Vehicle:</Text>
                                </Column>
                                <Column align="right">
                                    <Text style={{ fontSize: '18px' }}>
                                        {[vehicleColor, vehicleType].filter(Boolean).join(' ')}
                                    </Text>
                                </Column>
                            </Row>
                        )}
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Detection Time:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{timestamp}</Text>
                            </Column>
                        </Row>
                        <Hr style={{ margin: '20px 0', borderColor: '#E5E5E5' }} />
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>
                                    Detected Fire Types:
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px', color: '#d32f2f' }}>
                                    {fireLabels || 'Fire'}
                                </Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Number of Detections:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{fires.length}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Highest Confidence:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{(highestConfidence * 100).toFixed(1)}%</Text>
                            </Column>
                        </Row>
                        {cameraId && (
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '14px', color: '#808080', marginTop: '10px' }}>
                                        Camera ID: {cameraId}
                                    </Text>
                                </Column>
                            </Row>
                        )}
                        {locationId && (
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '14px', color: '#808080', marginTop: '10px' }}>
                                        Location ID: {locationId}
                                    </Text>
                                </Column>
                            </Row>
                        )}
                    </Section>

                    <Section style={warningBox}>
                        <Text style={{ fontSize: '16px', color: '#d32f2f', fontWeight: 'bold', marginBottom: '10px' }}>
                            IMMEDIATE ACTION REQUIRED:
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#808080', lineHeight: 1.6, marginBottom: '8px' }}>
                            1. Contact fire department immediately (Dial 101)
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#808080', lineHeight: 1.6, marginBottom: '8px' }}>
                            2. Evacuate the area if safe to do so
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#808080', lineHeight: 1.6, marginBottom: '8px' }}>
                            3. Activate fire suppression systems if available
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#808080', lineHeight: 1.6 }}>
                            4. Do not attempt to extinguish large fires - wait for professionals
                        </Text>
                    </Section>

                    <Section>
                        <Row style={footer.policy}>
                            <Column>
                                <Text style={footer.text}>Web Version</Text>
                            </Column>
                            <Column>
                                <Text style={footer.text}>Privacy Policy</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Text style={{ ...footer.text, paddingTop: 30, paddingBottom: 30 }}>
                                This is an automated fire detection alert from Gateless Parking System.
                            </Text>
                        </Row>
                        <Row>
                            <Text style={footer.text}>
                                © 2024 Gateless Parking, Inc. All Rights Reserved.
                            </Text>
                        </Row>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

export default FireAlertEmailTemplate

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "10px auto",
    width: "600px",
    maxWidth: "100%",
    border: "1px solid #E5E5E5",
};

const track = {
    container: {
        padding: "22px 40px",
        backgroundColor: "#F7F7F7",
    }
}

const alertBox = {
    padding: "20px",
    backgroundColor: "#ffebee",
    border: "2px solid #d32f2f",
    borderRadius: "4px",
    margin: "20px 40px",
}

const warningBox = {
    padding: "20px",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "4px",
    margin: "20px 40px",
}

const footer = {
    policy: {
        width: "166px",
        margin: "auto",
    },
    text: {
        margin: "0",
        color: "#AFAFAF",
        fontSize: "13px",
        textAlign: "center",
    } as React.CSSProperties,
};



