import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column } from '@react-email/components'
import React from 'react'

interface OverstayEmailTemplateProps {
    plate: string,
    address: string,
    overstayHours: number,
    overstayMinutes: number,
    additionalCharge: number,
    originalEndTime: string,
    currentTime: string,
    bookingId?: string
}

function OverstayEmailTemplate(props: OverstayEmailTemplateProps) {
    const {
        plate,
        address,
        overstayHours,
        overstayMinutes,
        additionalCharge,
        originalEndTime,
        currentTime,
        bookingId
    } = props

    return (
        <Html>
            <Head />
            <Preview>Vehicle overstay detected - Additional charges apply</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading as="h1" 
                        style={{ fontSize: '36px', lineHeight: 1.3, color: "#747474", fontWeight: 700, textAlign: "center" }}
                    >
                        ⚠️ Vehicle Overstay Alert
                    </Heading>
                    <Hr />
                    
                    <Text style={{ fontSize: '22px', padding: '20px', lineHeight: 1.3, color: "#808080" }}>
                        A vehicle has exceeded its booked parking time and requires additional charges.
                    </Text>

                    <Section style={track.container}>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>License Plate:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px', textTransform: 'uppercase' }}>{plate}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Location:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{address}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Original End Time:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{originalEndTime}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>Current Time:</Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '18px' }}>{currentTime}</Text>
                            </Column>
                        </Row>
                        <Hr style={{ margin: '20px 0', borderColor: '#E5E5E5' }} />
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>
                                    Overstay Duration:
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>
                                    {overstayHours} hour{overstayHours !== 1 ? 's' : ''} {overstayMinutes > 0 ? `and ${overstayMinutes} minute${overstayMinutes !== 1 ? 's' : ''}` : ''}
                                </Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#d32f2f', marginTop: '10px' }}>
                                    Additional Charge Required:
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#d32f2f', marginTop: '10px' }}>
                                    ₹{additionalCharge.toFixed(2)}
                                </Text>
                            </Column>
                        </Row>
                        {bookingId && (
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '14px', color: '#808080', marginTop: '10px' }}>
                                        Booking ID: {bookingId}
                                    </Text>
                                </Column>
                            </Row>
                        )}
                    </Section>

                    <Section style={warningBox}>
                        <Text style={{ fontSize: '16px', color: '#d32f2f', fontWeight: 'bold', marginBottom: '10px' }}>
                            Action Required:
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#808080', lineHeight: 1.6 }}>
                            Please contact the vehicle owner to collect the additional parking fee. 
                            The vehicle has exceeded its booked time and is subject to overstay charges.
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
                                This is an automated alert from Gateless Parking System.
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

export default OverstayEmailTemplate

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



