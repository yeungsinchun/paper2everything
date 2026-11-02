# OCR transcript: Active Physics Book 9 (Medical Physics elective), Chapter 2 — Non-ionizing Medical Imaging

Intake only. Never shown to students and never shipped (the root `.dockerignore` drops `notes/_source/`).

## Front matter

- **Source PDF:** `active-physics/book-9.pdf` (138 pages; image-only scan, no text layer). Copied read-only into the gitignored `paper2notes/active-physics/`.
- **Pages used:** PDF pp.47–88 = printed pp.52–93. Printed page = PDF page + 5 for this chapter. The chapter opener (printed pp.50–51) is not in the scan.
- **How chapter boundaries were identified:**
  1. PDF p.47 opens "2.1 Medical imaging"; running headers read `2 Non-ionizing Medical Imaging`.
  2. PDF p.49 opens "2.2 Ultrasound scans"; PDF p.70 opens "2.3 Endoscopy".
  3. PDF pp.79–82 are "Summary"; PDF pp.83–88 are "Chapter Exercise".
  4. PDF p.89 opens "3.1 X-rays and radiographic imaging" with running header `3 Ionizing medical imaging`.
- **OCR method:** `pdftoppm -r 200 -png` per page, then Tesseract 5.5.3 `-l eng`. Tables of acoustic impedance (PDF p.53) and all formulae were checked against the page images.
- **QB bank:** `QB_E402` (61 items: 37 MC, 14 SQ, 10 LQ; ids `PHY1902…`) is the publisher bank for this chapter. Endoscope and optical-fibre items also appear in `QB_E401`.
- **DSE classification:** none (elective, Paper 2; not held by `paper2db`).

## Transcript (raw OCR per page)

### PDF p.47 / printed p.52

We have already learnt how vision and hearing work. In fact,
both senses function by detecting waves from the environment.

Apart from light waves and sound waves, we can make use of
various kinds of waves to probe the inside of our body as well
as to detect our outside environment. The process of creating a
visual representation of the inside of our body for medical use
is called medical imaging.

Some waves used in medical imaging are ionizing, e.g. X-rays
and gamma rays. In contrast, some waves, e.g. ultrasound and
visible light, are non-ionizing. In this chapter, we shall focus on
the non-ionizing imaging methods first.

(a) Ultrasound scan (ultrasound waves)

(d) CT scan (X-rays) (e) Radionuclide imaging (y rays)
Fig. 2.1 Various medical imaging methods (and the types of waves being used)

### PDF p.48 / printed p.53

1] Image quality

Like vision and hearing, every imaging method has its own
limitations. The image quality is usually limited by

e the wavelength of the waves used,
¢ how fine the detector is, and

¢ the technique used to create a visual representation from the
signals due to the waves.

However, image quality is not the only concern when we
consider which imaging method is the most appropriate.

We also need to think about other factors such as the purpose,
cost, time, effects on the patient, etc.

[fe] Invasive and non-invasive

Some medical imaging methods are invasive, i.e. instruments
have to be introduced into a patient’s body. For example, before
a thyroid scan, a radioactive tracer has to be introduced into the
patient's body. The imaging method is thus invasive.

However, even non-invasive methods may harm the human
body. For example, a patient taking an X-ray image is exposed
to ionizing radiation, though the chance of adverse effects is
very small.

Having gone through the introduction, we shall begin to learn
our first imaging method in the next section.

Checkpoint @

Medical imaging

<4 For comparison, the resolving power
of an eye depends on the wavelength
of light and the density of cones.

1:67.2mm. 2: 91.2 mm.

Fig. 2.2 Instead of showing the detailed
structure, this image of the kidney can
tell the doctor how well the kidney is
functioning.

1. The photo shows an imaging
method that can reveal a higher
temperature in the right hand
(red region) of the patient.

The method uses a kind of
electromagnetic waves. What is it?

imaging.

2. In Book 5, we have already learnt that radioactive
tracers can be introduced into a patient's body to
monitor the body function. Apart from the cost,
suggest ONE MORE factor to be considered.

3. From what we have learnt in the last chapter, name
ONE wave phenomenon that may limit the
resolution of a medical image.

4. True or false:

(a) Only visible light can be used for medical

(b) Some medical imaging methods may have
adverse effects on a patient.

(c) Only invasive imaging methods will harm a
patient physically.

### PDF p.49 / printed p.54

yw Ultrasound scans

The first imaging method we are going to discuss is the
ultrasound scan. As its name suggests, it uses ultrasound
waves to produce images.

Ultrasound

We have already learnt what ultrasound waves are in the book
Wave Motion. Let’s do a quick revision of what it is.

Nature
Ultrasound is a kind of sound waves. Its prefix ulfra- implies audible
that such sound waves are above the upper limit of the human pracy
audible frequency range, i.e. > 20 kHz (20 000 Hz). }
Unlike humans, some animals such as bats use ultrasound (up eee
to 200 kHz) to detect their surrounding environment. Such =
20 Hz 20.000 Hz

an animal can emit ultrasound pulses and analyse the echoes

to locate the object from which the pulses are reflected. This eg ae UNIESOUeL Aa
. . a frequency range

process is called echolocation (|= #7 (i) .

bat

Fig. 2.4 How a bat uses ultrasound to detect an environment

In ultrasound imaging, the frequency of ultrasound used is
even higher, typically from 1 to 20 MHz. We shall soon see that = &_ 1 Miz=1 000000 Hz
its key principle is similar to echolocation.

PERE RHEE RHEE E EEE E EEE E HEHEHE EEE EEE EEE EEE HEHEHE HEHEHE HEHEHE EEE HEHEHE E HEHEHE HEHEHE EEE EEE EEE HEHEHE EERE HEHE HEHEHE EEEEEEEEEEE EEE EEE EEE HEHE ED

ultrasound scan MHF ultrasound Mii

### PDF p.50 / printed p.55

Ultrasound scans

Piezoelectric effect

We know that all sound waves are produced by oscillations or
vibrations. Ultrasound is no exception.

Ultrasound can be detected

and produced by a special

kind of crystals. A voltage

is developed across the two

ends of such a crystal when

it is compressed or stretched.

This is called the piezoelectric = < The prefix piezo- means pressure.
effect (generating electricity

from pressure).

Fig. 2.5 Quartz crystals are piezoelectric.

When a piezoelectric crystal is hit by ultrasound, its shape

i) Snapshot

changes slightly, so a voltage is developed across its two ends. EOE MT OPE EEE ERT TE
This enables us to detect ultrasound through measuring the Producing sparks
voltage across the crystal (Fig. 2.6). The piezoelectric effect is also

applied in lighters to produce a
high voltage which in turn ionizes

ee oe — ;
5 9 Z the air and produces sparks.
-"~ 7 = + +

original shape e+

Fig. 2.6 Piezoelectric effect: When a piezoelectric crystal is
compressed or stretched, a voltage is developed across the crystal.

In reverse, when a piezoelectric crystal is applied a voltage,
its shape will change. Whether it is compressed or stretched
depends on the polarity of the applied voltage. When the
voltage is removed, the crystal will restore its shape through a
series of oscillations and ultrasound is emitted (Fig. 2.7).

Fig. 2.7 Converse of piezoelectric effect: Applying a voltage across a piezoelectric crystal What makes the crystal distort is the

ultrasound
emitted

7 changing voltage
original shape

will make its shape change. voltage, not the current.
Detecting ultrasound with an What makes the crystal vibrate is the
22 hKe3| oscilloscope change of voltage, not the voltage itself.
tt} (RP 92-041)
cence x “TSS / 0 9rgs sing "amauta snmmeasaaeaeaaneeeememaaaaeeaeeaaaaemama

### PDF p.51 / printed p.56

orl Non-ionizing Medical Imaging

Transducer

In practice, a piezoelectric crystal is installed in a device called
a transducer for producing and detecting ultrasound. When
producing ultrasound, an ac voltage is applied across the
crystal so that the crystal compresses and stretches to produce
ultrasounds of a certain frequency.

When detecting ultrasound, the ac voltage developed across the
crystal will be measured by a CRO. The stronger the ultrasound,

the higher the ac voltage is developed. 4) We should notice that a transducer
is actually an energy converter that

° ° ° rt electricity int id and
However, a single piezoelectric crystal cannot produce and RE cece ene eee

detect ultrasound at the same time. Usually, the crystal emits —
pulses with 10 us duration and waits for 1 ms (1000 us) before 4 i ie
emitting the next pulses. During the waiting time, the crystal I
can be used to detect ultrasound.

acoustic window

metal film electrodes
deposited on crystal

positive
terminal (

_— Piezoelectric crystal

earthed
case

insulating backing acoustic
layer material window

Fig. 2.8 An ultrasound transducer and its schematic diagram

PEER RREREEEEHEEE HEHE EE EEEEE EEE EEE EEE EEE HEHEHE HEHEHE HEHE HEHE HEHEHE EEE EEE EEE EEE EEE HEHEHE HEHEHE HEHEHE HHE HEHEHE EEE EE EE EEE EE HEHEHE EEE

transducer HER

### PDF p.52 / printed p.57

Ultrasound scans

im Enrichment

eeereeeeeeeeeeeeeeeeeeeeeeeeeeeee

More about the transducer

. . : . a aor tae produced b'
Let us expand our discussion about the transducer design. piezoelectric crystal a fons

First, the choice of piezoelectric crystals is not arbitrary. The most common
material used is PZT (lead zirconate titanate) as it can convert mechanical

energy into electrical energy more efficiently than other materials. The
thickness of the crystal is also carefully calculated. As you may notice, both MF escdoced births
the front and the back of the crystal will emit ultrasound in antiphase. If the '------- 4 inside back surface

thickness of the crystal is 1A, 2A, 3A or so, the ultrasound waves in the front 7 +

will interfere destructively (Fig. a). Therefore, the optimum thickness is half of
the wavelength (0.5A, 1.5A, 2.5A, etc.) produced in the crystal.

Second, we should notice that there is backing material behind the crystal.
The backing material is used to damp the pulse to a suitable duration.
Without the backing material, the duration of the pulse produced by the
crystal will be too long (Fig. b).

Last but not least, there is an acoustic window in front of the piezoelectric
crystal. This helps reduce any reflection from the surface of the target
object. As you will learn, how much waves are reflected depends on the
difference in acoustic impedance between two media. Fig. b Damping effect of backing material

Checkpoint @

Which of the following statements about 4. Which of the following best represents the pulses
ultrasound is correct? sent out by an ultrasound transducer? (A: amplitude,
A. It travels faster than sound in the same & time)

medium. A. 4A B. 4A
B. Its frequency must be higher than 20 000 Hz.
C. Its intensity level must be higher than 120 dB. ; t/ ms ; t/ ms

A voltage is developed between the two ends of a
piezoelectric crystal when the crystal

A. is compressed.

B. is stretched.

C. is either compressed or stretched. 1

What is the function of a piezoelectric transducer?

B.. “D false:
A. Emit ultrasound signals rue or false

B. Receive ultrasound signals (a) Ultrasound shows diffraction and interference.

© Redcoltheshow (b) Acurrent flows through a piezoelectric crystal
WHENEVER it is compressed or stretched.
(c) The speed of the ultrasound emitted depends
on the power output of the transducer.

### PDF p.53 / printed p.58

orl Non-ionizing Medical Imaging

(} Travelling of ultrasound in media

Next, let us learn about the travel of ultrasound in a medium.

Speed

In a human body, ultrasound travels at fairly the same speed in
soft tissues and organs, which have a high percentage of water.
It travels fastest in bones, which are mainly solids.

Acoustic impedance

Apart from speed, another important property relating to the
travel of ultrasound is the acoustic impedance of the medium.
It measures how easy ultrasound waves travel through a
particular medium. In ultrasound imaging, the acoustic
impedance Z of a medium can be defined as

Z=pc

where p is the density of the medium and c is the ultrasound
speed in that medium. The larger the value of Z, the more easily
the ultrasound waves can travel through the medium. Its unit is
kg m™~s" or Rayl:

1 Rayl=1kgm*s'
In general, the denser the medium, the higher the wave speed.

Therefore, acoustic impedance Z typically increases with
density p.

substance | rel : | Z=pc/10° kgm’ s"'

Table 2.1 Values of acoustic impedance for different body tissues and materials

PEER RRR RRR HEHEHE HEHEHE EEE EEE EEEEE HEHE HEHEHE HHH E HEHE HHHHHHHHEEETETTEEE EEE EEE EEE EEE HEED

acoustic impedance Ai

ultrasound in:

solid

Fig. 2.9 Ultrasound travels fastest in
solids and slowest in gases.

ih Enrichment

Acoustic impedance

Sound wave is a pressure wave
in a medium. More precisely,
acoustic impedance Z
measures how much sound
pressure p is generated by the
vibration of molecules of a
medium at a certain frequency.
Mathematically, p = Zc where
c is the wave speed in the
medium. Therefore, you may
see in some books that the
unit of acoustic impedance is
Pasm".

air (25 °C) 346 0.000 410 Notice that the acoustic impedance of air is
fat 1450 1.38 especially low.

water (25 °C) 1493 1.48

soft tissue 1540 1.63 »

liver 1550 1.64 —

blood (37 °C) 1570 1.67 J

bone 4000 3.8 to 7.4

PZT (piezoelectric crystal) 4000 30.0 —

& The piezoelectric crystals in
transducers are usually made of PZT.

Oe e PPP PPC eee Cece ee eee ee eee eee eee eee eee cece)

### PDF p.54 / printed p.59

Ultrasound scans

Intensity reflection coefficient

When a train of ultrasound waves is incident on a boundary
between two media, it will be partly transmitted and partly

reflected. The intensity reflection coefficient a shows how
much the waves are reflected:

where I, and J, are the intensities of the reflected waves and the a oe
intensity of the be intensity of the
incident waves, respectively. If the intensity of the incident waves amie al waves
is 1 unit, the intensity of the reflected waves is a unit (a < 1). B. |
Suppose the train of waves travels from a medium of acoustic Y esi latewz:

impedance Z, perpendicularly into another medium of acoustic scoustie
impedance Z,. The coefficient and the impedances have the impedance Z,
following relation:

(Z, -Z,) Fig. 2.10 What happens when a train of

Q=—= waves meets a boundary

L Bp Example 2.1 On an air-skin boundary

The density of air is 1.18 kg m°. The sound speed is 346 ms ' in air.
(a) What is the acoustic impedance of air?

(b) The acoustic impedance of skin is 1.63 x 10° kg m™ s"'. Find the
intensity reflection coefficient when ultrasound travels from
air to skin.

De SOO cseiiaucnnecscennmnnnmmmanremneriins
(a) The acoustic impedance is
Z = pc = 1.18 x 346 = 408.28 = 408 kg m™ s"
(b) The intensity reflection coefficient is

(408.28 — 1.63 x 10°)
a= = 0.9990 = 0.999

(408.28 + 1.63 x 10°)

DEERE EERE EERE EERE RRR REEE EEE H HEHEHE EEE HEHEHE HEHEHE HEHEHE HEHE HEHE HEHEHE HEHEHE HEHE HEHEHE EEE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE

intensity reflection coefficient 4) SG

### PDF p.55 / printed p.60

orl Non-ionizing Medical Imaging

We should see that nearly all ultrasound is reflected on an air-
skin boundary due to the large difference in acoustic impedance.

Therefore, a layer of coupling gel or other medium has to be
applied to the patient’s skin during an ultrasound scan. It can
fill the air spaces to avoid reflection of ultrasound from possible

air—skin boundaries. Also, its acoustic impedance is similar to Fig. 2.11 Coupling gel applied on the
typical skin so that most ultrasound intensity can be transmitted. i a tala

Li mp Example 2.2 Intensity reflection coefficient

An ultrasound beam of initial intensity 0.5 W m° is incident on
a soft tissue—bone interface from the soft tissue side. Take the
acoustic impedances of the tissue and the bone to be 1.63 MRay]
and 5 MRayl, respectively. (1 MRayl = 10° kg m*s"')

(a) Find the intensity of the reflected ultrasound beam.

(b) If there is no loss of energy, what is the intensity of the
transmitted beam?

(c) Do your answers change if the beam is incident from the bone side?

Di SUSY icassscccncascernmenncerveccmmncniennmemuniains
(a) The intensity reflection coefficient is
(Z,-Z,)?> (5-1.63)?

1. a — —
(Z,+Z,)> (5+1.63)?

= 0.2584

Therefore, the intensity of the reflected beam is
0.5 x 0.2584 = 0.129 W m*
(b) The intensity should be 0.5 x (1 — 0.2584) = 0.371 W m”.

(c) The answers remain unchanged.

The intensity reflection coefficient depends on the difference
of acoustic impedance between the two media. Therefore, the
travelling direction should not affect the answers.

When an ultrasound beam travels through a medium, its
intensity gradually decreases. This can be due to

¢ energy being absorbed by the medium (and usually f\
converted to heat), or

¢ ultrasound waves being scattered by the medium. Nn

coupling gel MAsEF

### PDF p.56 / printed p.61

PLD ON SID LSI
SSS SLI ae
@ LPIA DIN
he I
PIAS OI SL Or
@ SIN x, SSS
energy absorption scattering of waves

Fig. 2.12 Attenuation of an ultrasound beam

This phenomenon is known as attenuation. The greater the
attenuation that an ultrasound beam suffers, the shorter the
distance it can travel before it dies out.

Attenuation is usually measured by the intensity level drop (in dB)
for every unit distance travelled by the beam. How much a beam is
attenuated depends on the medium in which it travels. In general,

attenuation in bone is greater than that in soft tissue. In addition,
the higher the frequency, the higher the attenuation (Fig. 2.13).

Checkpoint @

1. Fill in the table below.

4. The graph shows how an ultrasound beam

substance | c/ms" | p/kgm? |Z/kgm’s"' attenuates in two media X and Y for different
air (0 °C) 330 425.7 frequencies.
brain 1541 1050 attenuation / dB cm"
skull bone 1412 5.76 x 10° } x
2. What is the intensity reflection coefficient when a
train of ultrasound waves travels from the skull Y
bone to the brain? ea
( ? oo oe
a= ( ? 7 ]
frequency / MHz

3. True or false:
True or false:

(a) The acoustic impedance of a medium is atways
positive.

(b) The intensity reflection coefficient cANNoT be
greater than 1.

(c) The intensity reflection coefficient is equal to 1
if the two media forming the boundary have
the same acoustic impedance.

(d) Acoustic impedance is used to measure the than X.
attenuation of waves.

Ultrasound scans

attenuation / dB cm"!

200 = bone
20
10 4 soft tissue
blood

1 10
frequency / MHz

Fig. 2.13 Attenuation in various media
for different frequencies

% = Attenuation in air is very small.
Applying gel on skin is not for
reducing the attenuation through
the gap but the reflection on the
air-skin boundary.

26 = Acoustic impedance is not a
measure of attenuation. It is used
to determine the reflection on the
boundary.

(a) The higher the frequency, the shorter the
distance an ultrasound beam can travel in X
before it dies out.

(b) An ultrasound beam travels a longer distance
in X than Y before it dies out for the same
initial intensity.

(c) An ultrasound beam must travel faster in Y

SERRE EERE EEE HERR RHEE HEHEHE AHHH HEHEHE EEE HEHEHE HEHEHE E HEHE HEHEHE HHH H HEHEHE EEE EEE EEE HEHEHE HEHEHE EEE HEHEHE EHH HEHEHE HEHE HEHEHE HEHEHE HEHE EES

attenuation ##

### PDF p.57 / printed p.62

orl Non-ionizing Medical Imaging

Pulse-echo technique

In a uniform medium, ultrasound travels at a definite speed.
The distance travelled d and the wave speed c are related by

d=ct
where t is the time taken.

This relation gives rise to the pulse-echo technique used in
ultrasound imaging. As illustrated in Fig. 2.14, an ultrasound
pulse emitted by the transducer travels a distance of d= 2s
before it returns. If the time lapse is f, the thickness s of tissue 1

can be calculated by % Put it another way, t here represents
the ‘out and back time’ that the
ct pulse takes to travel to and return
2s=ct > s= oy from the boundary.

For example, if the wave speed in tissue 1 is 1550 m s™' and the
time lapse between the emission and the reception of the pulse
is 20 us, the thickness of tissue 1 would be

1550 x (20 x 10°) /2=0.0155 m=1.55 cm. W Note that the frequency of ultrasound

remains unchanged when the pulse

travels through different media.
tissue 1 tissue 2

time = 0

skin tissue boundary

time a:
2

skin tissue boundary

echo from echo from
skin tissue boundary

time =t

skin tissue boundary

Fig. 2.14 Pulse-echo technique

PERE RRRRE EEE EE HEHE EEE EEEHE EEE EEE EEE EEE EEE EEE HEHEHE HEHE HEHEHE HEHEHE HTEEEEEEE EEE EEE EEE EE EEE HEHEHE HEHE HEHEHE HAE HEHEHE EEE EEE EEE EEE E HEHEHE HEED

pulse-echo technique Mi 5 2 @ i

### PDF p.58 / printed p.63

>) Ultrasound scans

Next, let us learn how we can make use of the echoes reflected
from the boundaries inside a patient to produce useful medical
images.

Echoes from different boundaries

When carrying out an ultrasound scan, a transducer connected
to a computer is placed on the surface of a patient and sends
ultrasound pulses into the body, with echoes received from
different boundaries inside the body. The echoes provide two
pieces of important information.

¢ Astrong echo is received from a boundary formed by two
materials with a large acoustic impedance difference.

¢ Echoes from deeper boundaries return to the transducer at a
later time. The depth of the boundary can be determined if
the wave speeds in the media are known.

When the transducer picks up the echoes, it will convert them into
electrical signals and feed them into the computer. The stronger
the echo, the stronger the signal. The computer then constructs
images from the signals, according to the scan mode chosen.

Ultrasound scans

Fig. 2.15 Placing a transducer onto a
patient's body during an ultrasound scan

<The ultrasound wave speeds in soft
tissues are more or less equal to
1500 ms”.

<The computer also does many
calculations to enhance the images.

Fig. 2.16 A typical ultrasound scanner Fig. 2.17 Different shapes of transducers for different scanning purposes

### PDF p.59 / printed p.64

ba Non-ionizing Medical Imaging

A-scan

An A-scan is the simplest scan mode. A stands for amplitude.

The computer measures the amplitudes of the echoes indirectly

from the electrical signals and builds a graph of amplitude

against time (Fig. 2.18). The time is then converted into distance

if the speed is known. Ay Recall d= ct.

An A-scan can be used to determine the thickness of an eye lens
and the diameter of an eyeball. It can also be used to detect any
abnormalities in structure.

transducer 1 2 3 45
\ ro } to
\ 14 \ rt
\ 14 | reo
1 4 4 5

! pal He er, | tt amplitude
\ abe | e.
\ 17 } Vt

transducer \ n nN py
st BL 14 a 4 eo
5 \ 14 | ie
=>» | “TL 14 | \ tN =
| 1 | } |
\ 3 } it
\ 14 } v1
12 14 ooy It
aS es i
\ 4 \ eo
14 } Vt
a 1 ot 4! ef
\ 14 oer ml
14 Mu FLU
\ 14 } ml
hice % A compensator is used to amplify the
not to scale echoes from deeper boundaries. See
Fig. 2.18 How A-scan works Enrichment on p. 66 for details.

ev GAIN: 75dB
TGC = -—SdB/cm

B 6oon a

transducer

30 a0 so 50
Mop Jul’ 6716 15:51

PERE RRR RRR REET E EEE E HEHEHE HEHE EEE EE EEE EEE EEE H HEHEHE EEE EE HEEEE EEE HEHEHE HEHE EEE EEE HEHEHE HHH HEHEHE HEHE HEHEHE EEEEEEEEHE EEE EEE HEHE EE

A-scan A iia

### PDF p.60 / printed p.65

Ultrasound scans ie:

An B-sean is a common ultrasound scan mode. B stands for
brightness. The computer measures how strong the echoes are
and use bright dots to represent the strength. The stronger the
signal, the brighter the dot (Fig. 2.20).

amplitude brightness

transoucer

body

surrace A-scan B-scan

Fig. 2.20 How B-scan works

Usually, a B-scan is used to obtain a 2-D image of the interior of — @ Recall that A-scan only gives a 1-D image.
a body. The transducer sends out a fan beam of ultrasound and = 4
the computer constructs images using the echoes received from

a sector of the boundaries (Fig. 2.21). stain am
ae a
eee ——
transcucer Paseo nngeaetes
fan beam linear beam

Fig. 2.21 How a 2-D B-scan

image is formed

Ultrasound images
(2 92-42)

B-scan B HR

### PDF p.61 / printed p.66

ba Non-ionizing Medical Imaging

Common applications of B-scan include checking foetal growth
and detecting abnormal pathologies such as tumours and cysts
in liver, pancreas and kidneys.

Sonar and medical imaging

The first ultrasound application applying echolocation can be traced to
World War I. Inspired by the sinking of the Titanic (#43#/E4%%), scientists
began to think of a device for detecting underwater objects. The first device
was invented during World War | to detect submarines. The echolocation
technique was further applied to electromagnetic waves and radar was
finally invented during World War II.

Incidentally, another ultrasound device was invented during World War II. It
was a metal flaw detector for examining battle tanks and aeroplanes. It sent
ultrasound pulses into a metal object and abnormal echoes would be received
if the pulses were reflected from a flaw, which was usually an air gap.

After World War II, the metal flaw detector became commercialized.
Scientists found that it might be possible to probe the human body by
using ultrasound using the techniques behind sonar and radar. Finally, the
first 2D ultrasound image was published in 1952 and the detector used at
that time was actually the metal flaw detector.

in Enrichment

Time-gain compensator

The echoes from deeper boundaries tend to be weaker. However, some 4 The weakening of the transmitted

of them may contain useful information and should be properly included. pulse is due to attenuation and

. - ay : multiple reflections at the boundaries

Hence, a time-gain compensator is linked to the transducer to increase the é
c , encountered during travel,

gain of the signals with time. In other words, later signals from deeper

boundaries are amplified more than the earlier signals (from boundaries

closer to the transducer).

— _ 66

### PDF p.62 / printed p.67

Ultrasound scans
Kes xampte23 A-scan

An ultrasound transducer connected to a CRO is placed on the
skin. The layers of tissue A and B are 1.5 cm and 1.2 cm thick,
respectively. It is known that the ultrasound speed is 1.5 x 10° ms"
in A and 4.0 x 10° ms" in B.

air tissue A tissue B
transducer
boundary 1 2 3
~ + =| cal
1.5 em 1.2. cm 4 us

The CRO trace shows the pulse received due to the reflection on
boundary 1. The time-base setting is 4 ts per division.

(a) Complete the CRO trace to show the reception of echoes from
boundaries 2 and 3.

(b) If the gel is not applied, how would it affect the CRO trace
observed?

| Yo) (0) te):

(a) The time lapse between the reception of echoes from boundary
1 and that from boundary 2 can be calculated from

ct 2s _2x0.015

Z ¢ 15x10°

= 0.00002 = 20 us

Similarly, the time lapse between the reception of echoes from
boundary 2 and that from boundary 3 is

2 x 0.012
4.0 x 10°

Therefore, the CRO

2
trace should look
like this: 1 3
<> The point is peak 2 is higher than

peak 1, and peak 3 is lower than
peak 2.

= 0.000 006 = 6 us

(b) If the gel is not applied, only signal 1 would be observed
because most of the ultrasound pulses are reflected at the
air—-skin boundary.

### PDF p.63 / printed p.68

orl Non-ionizing Medical Imaging

KS Example 2.4 1-D B-scan

In a 1-D B-scan, an ultrasound pulse is sent to a patient’s body. The
spots 1, 2 and 3 correspond to the echoes received from boundaries
1, 2 and 3, respectively. It is known that the ultrasound speed is
1500 ms’ in A and 4000 ms" in B.

air tissue A tissue B tissue C

transducer

boundary 1 2 3 ~

(a) Estimate how thick the layers of A and B are. Express your
answer in cm.

(b) In fact, the echoes received from boundary 2 are stronger than
that from boundary 3. Suggest two possible reasons.

B. SOLUTION o.oo cc ccc ccc cccccucucucucececucucccucucucucuseeuees

(a) Applying s = > layer A has a thickness of

1500 ~ [4 = (8 x 10)] /2 = 0.024 m=2.4 cm.
The thickness of layer B is
4000 x (8 x 10°°) /2=0.016 m = 1.6 cm.

(b) First, tissues A and B may have large difference in acoustic
impedance and most of the ultrasound is reflected on
boundary 2.

Second, the ultrasound is attenuated in tissue B.

Alternative

It is also possible that tissue C has an acoustic impedance
similar to B. As a result, most of the ultrasound is transmitted.

If the thickness of tissue A is halved, how would the separation Ans: (i) halved
(i) between spots 1 and 2, and (ii) between spots 2 and 3 change (ii) remains unchanged
accordingly?

### PDF p.64 / printed p.69

Ultrasound scans
Ki Example 2.5 ani Baca

An ultrasound scan can be used to

measure the size of a structure inside
the body. The photo on the right shows
an ultrasound scan of a human eye.
Unfortunately, the patient is suffering
from eye tumour.

(a) The region between the lens and the retina is dark. Briefly
explain why.

(b) Find the height of the tumour (the distance between the crosses).

OLUTION 20. cece cece cece ene cence eeeeeeeeeeeeeeeeeeeeenueeeeaees

(a) The region is dark because very little ultrasound is reflected.
This suggests that the region is fairly uniform in acoustic
impedance.

(b) The distance between the two crosses is 1.6 cm on the page.

Using the scale, the height should be 1.6 « 4.5 / 7.9 = 0.9 cm. 4 Make full use of the scale to

minimize the error.

im Enrichment

M-scan

Apart from an A-scan and a B-scan, transducer CRO display ebony

reflection

an M-scan is another common

mode of producing medical images.

An M-scan (M stands for motion)
is a record of position changes of

light spots in 1-D B-scan over a moving

period of time. The figure illustrates testo
its working principle. It can be used '
to monitor the motion of moving : a
structures such as a heart valve. reflecting ; '

surface '

69 -—

### PDF p.65 / printed p.70

ward Non-ionizing Medical Imaging

Checkpoint @

A transducer sends an ultrasound pulse towards the
organ of a patient's body. Two echoes are received
from the front and rear surfaces of the organ
separately. The CRO trace of the A-scan is shown.

20 Us

If the ultrasound speed in the organ is known, which
of the following can be determined from the image?

A. The acoustic impedance of the organ
B. The thickness of the organ

C. The intensity reflection coefficient on the front
surface

The B in B-scan stands for

A. banding.
C. brightness.

B. _ bisection.

Cysts (4€/M) in an ultrasound image usually appear
dark. This suggests that

A. acyst is uniform in density.

B. acyst can highly attenuate ultrasound.

C. acyst is harder than the surrounding tissues.

An A-scan is carried out to
measure the size of an organ.

During the scan, an
ultrasound pulse is sent to
the organ. Echoes are then =
received from the front and rear surfaces of the
organ and the time lapse is 50 us. If the ultrasound
speed in that organ is 1600 m s"', how thick is that
organ?

2

Discuss whether the strength of echoes received in
an ultrasound scan depends on the following or
not.

(a) Attenuation of the ultrasound in the tissue

(b) Spatial variation of the acoustic impedance of
the tissue

(c) Difference in acoustic impedance between the
two tissues forming a boundary

The photo below shows a B-scan image of a kidney.

(a) Point out the position at which the transducer
is placed.

(b) Indicate one boundary on which the
ultrasound is significantly reflected.

The photo below shows an ovarian cyst. According
to the scale on the right, estimate the cross sectional
area of the cyst (the dotted region).

a mes ca

Fr 160 mm

(a) What is the major difference between an
A-scan and a B-scan?

(b) Suggest one application of a B-scan.

### PDF p.66 / printed p.71

[3] Resolution vs penetration

For medical images, good resolution is important. The better
the resolution, the finer the details of the structures that can be
seen. In ultrasound imaging, you may often see two descriptive
words about resolution: axial and lateral.

The axial resolution refers to how small the structures can be
so as to be distinguished along the direction of the ultrasound
beam. It depends on the pulse duration. The shorter the
duration, the better the resolution (Fig. 2.25).

The lateral resolution refers to how small the structures can be
so as to be distinguished on the plane normal to the direction of
the beam. Ideally, a linear narrow beam incident on a boundary
will give a linear reflected beam. However, the beam may
diverge more and more due to diffraction when travelling in a
medium. Since waves of higher frequency are less diffracted,
this means the higher the frequency, the better the lateral
resolution (Fig. 2.26).

transducer unable to
distinguish the pulses

Ultrasound scans

Fig. 2.24 Axial and lateral resolution

Lateral resolution also depends on
the beam thickness. A narrower beam
4 can give better resolution.

transducer can distinguish
the pulses if the degree of

reflected from structures 1 and 2 diffraction is small
pulse from 1
incident i.
pulse \
reflected
pulse from 2 :
I \ anh
nF 7
boundary Fal
1 diffracted \_ diffracted
beam beam
2 ®
time ty 1 2 yea
Fig. 2.25 Ifthe dhuriton of the incldedl 2 is too Fig. 2.26 The degree of diffraction has to be small enough
long, the pulses reflected from the two boundaries may for the transducer to detect two separate pulses from the
be seen as one. two individual points.

Does using high frequency always produce images better? This
is not necessarily true. The reason is that ultrasound of higher
frequency suffers higher attenuation (see Fig. 2.13 on p. 61).
Therefore, structures near the surface, e.g. thyroid and breast,
can be imaged using a high frequency transducer (7 to 10 MHz).
For deeper structures, e.g. liver and kidneys, a low frequency
transducer (3.5 to 5 MHz) is preferred.

PERE E EEE E HEHEHE AHHH HEHEHE EEE EE EEE HEHEHE HEHEHE EEE HEHEHE HEHE HEHEHE HEHE HEHEHE ED

resolution 23#8# axial resolution MMDR# lateral resolution MM 2 ##

Pee e eee ee eee eee eee ee eee eee CeCe eee eee eee eee)

### PDF p.67 / printed p.72

ward Non-ionizing Medical Imaging

[3 Advantages and limitations

Advantages

An ultrasound scan has several advantages.

¢ Ultrasound is non-ionizing and has relatively small
health effects. Therefore, an ultrasound scan can be
used to examine a foetus.

¢ Itcan be used to distinguish between various soft tissues.

e It can detect movements of structures inside a
human body. With the advancement of technology,

it can even produce 3-D aay Fig. 2.27 Ultrasound can now be used to

seis . L-time 3-D images.
¢ It is inexpensive and readily available. produce real-time 3-D images

Limitations and precautions

However, an ultrasound scan has the following limitations and
safety precautions must be taken.

e It cannot be used to scan structures covered by bones and
gases as most ultrasound is reflected by them.

e Energy carried by ultrasound is absorbed by the tissues and
converted to heat. The power transmitted into the patient's
body should be carefully monitored.

e On certain occasions, gas bubbles may form due to ultrasound
and may damage the surrounding tissues if they burst. The
pressure in the region where ultrasound is applied has to be
carefully monitored.

Snapshot

Other uses of ultrasound

In the above paragraphs, we have mentioned the thermal effect and the & Healing
non-thermal effect of ultrasound. Both should be minimized in medical the knee with
ultrasound

imaging. However, we may make use of the effects in other ways.

The thermal effect of ultrasound may increase blood flow, relieve pain and
speed up the healing process of soft tissues. In certain surgeries, high power
ultrasound is used to burn malignant tissues.

The non-thermal effect can be applied to the treatment of kidney stones in
MenottpSy) (EA + fit). Two high power Eitiasound transducers can be A. The basis of ultrasonic
directed to focus at the stone and make it shattered. The small fragments lithotripsy is similar

will then pass out of the body in urine. to cleaning glasses with
an ultrasound cleaner.

### PDF p.68 / printed p.73

Checkpoint @

1, (a) The higher the frequency, the 3.

(higher/lower) the
resolution of ultrasound images.

(b) The higher the frequency, the
(deeper/shallower) the
penetration of ultrasound.

2. Is high frequency (7 to 10 MHz) or low frequency
(3.5 to 5 MHz) ultrasound suitable for scanning the
tissues or organs below?

(a) Breast (b) Kidney

(c) Liver (d) Thyroid

Ultrasound scans

Suggest Two advantages of using ultrasound to
diagnose unborn babies.

True or false:

(a) Higher frequency ultrasound can pass through
a human body with a smaller loss in energy so
as to produce finer images.

(b) Lateral resolution can be increased by using,
ultrasound of longer wavelengths.

(c) The machine for an ultrasound scan is bulky
and nor easily accessible.

Exercise

1. Acoupling medium has acoustic impedance close

to that of
A. air.
B. bone.

C. the piezoelectric crystal in the transducer.

D. soft tissue (skin). 2
2. Ultrasound is Nor suitable for scanning the brain

because

A. it is ionizing.

B. the brain is covered by bones.

C. the brain highly attenuates ultrasound.

D. the brain has high acoustic impedance.
3. Ina 1-D ultrasound scan, two echoes are received

from the front and the rear surfaces of a structure

separately. The time lapse is independent of

A. the ultrasound speed in the structure.

B. the difference in acoustic impedance between

that structure and the surrounding tissues. So.

C. the thickness of the structure.

D. all the above factors.

4, Which of the following about an ultrasound scan is
NOT correct?

A. It does nor involve ionizing radiation.
B. It can be used to examine the structure of an
unborn baby.

C. It can be used to measure the diameter of an
eyeball.

D. It can be used to study how well a kidney is
functioning.

The piezoelectric crystal and human skin have
acoustic impedances of 30 kg m™ s' and

1.6 kg m~s'', respectively. An ultrasound pulse is
now transmitted from the crystal to the skin.

(a) What is the percentage of the ultrasound
intensity transmitted into the skin?

(b) An acoustic window is inserted between the
crystal and the skin. It has an acoustic
impedance of 7kg m™s"'.

(i) What will be your answer in (a)? Does the
answer become smaller or larger? Neglect
the energy loss in the window.

(ii) Hence, or otherwise, explain the function
of an acoustic window.

An ultrasound beam is incident on a boundary
between two media X and Y along the normal. The
reflected beam is —6 dB as compared with the
incident one.

(a) What is the intensity reflection coefficient?

(b) What is the acoustic impedance of Y if that of X
is higher and has a value of 1.5 x 10° kg m®* s"'?

### PDF p.69 / printed p.74

ary Non-ionizing Medical Imaging

7. A transducer sends an ultrasound pulse into & 9. The photo shows the A-scan of the right eye of a girl.
medium A as shown. The axial diameter of the eyeball is found to be
20.75 mm. Take the ultrasound speed as 1550 ms”.

medium A medium B medium A

pio |] MM euro 2 Gl care orr ao

meee Ne

Serle

transducer

boundary 1 boundary 2

Tcom

Jul¢ 6°88 12131

(a) The data for the lens is missing.
The table below shows some properties of media A (i)

From the A-scan image, estimate the
and B.

thickness of the lens.

SSSCLITIC Arnie (ii) What is the time lapse between the

speed /ms"' reception of echoes from the front surface

A 950 1500 and the back surface of the lens?

(b) The photo below shows the A-scan of the left eye

8 1050 = of the same girl. In fact, one of the eyes of the girl

is short-sighted. Is it the left or the right? Explain
(a) Briefly explain how a transducer can emit and

briefly.
detect ultrasound.

(b) The transducer receives two echoes from sro] MB eUTO 2 MN care oF Z prewctc
boundaries 1 and 2 separately. Find the time eee OO *P
lapse between them. ere

(c) Find the intensity reflection coefficients when lit 20.97.
the ultrasound pulse is incident on boundaries | |
1 and 2, respectively.

a” beatae * pa
8. An A-scan is performed on an organ. In the CRO July 6708 12191

trace shown, signals 1 and 2 are due to the echoes
received from the front and rear surfaces of the 10. The photo shows a B-scan image of a kidney.

organ, respectively.

| Lt Kidney

).02 m

(a) There are bright and dark areas in the image.

How are they formed?

(a) State rwo factors that determine the intensity (6): What should be the frequency range of the
of the echoes.

(b) What is the thickness of the organ? The
ultrasound speed in the organ is 1500 ms".

ultrasound for diagnosing the above organ?

(c) Suggest rwo advantages of using an ultrasound
scan to diagnose kidneys.

— 74

### PDF p.70 / printed p.75

2.3

Endoscopy

Another common imaging method that uses non-ionizing
radiation is endoscopy. Its working principle is based on the
total internal reflection of light. Let’s do a quick revision on this
principle first.

Total internal reflection

Snell's law and critical angle

When a light ray travels in a medium and is incident on a
boundary with the next medium, it is partly refracted and
partly reflected. The refraction of light obeys Snell’s law:

n, sin 0, =n, sin 0,

If n, > 5, and 6, is larger than the critical angle, all the light will
be reflected. The critical angle c can be found by

n,sinc = n,sirx90° > sinc = —

Total internal reflection

Total internal reflection occurs on a boundary when

1. the light ray is directed towards an optically less dense
medium, and

2. the angle of incidence is greater than the critical angle.

medium 2

<n: refractive index of medium 1
n,: refractive index of medium 2
@,: angle of incidence

6,: angle of refraction

¥% Conditions for total internal reflection

medium 1

(a) @,<c (b) O,=c
Fig. 2.28 When light meets a boundary where n, > n,

(c) @, > c (total internal reflection)

SAREE REE EERE EEE HERR EHH E HEHEHE HEHEHE HEHEHE HEHE EEE EEE HEHEHE HEHE HEHEHE AHHH HEHEHE HEHE EEEEE HEHEHE HEHEHE EEE EEE HEHEHE HEHEHE HEHEHE EEE HEHEHE HEHE EES

endoscopy Puss ift® ft

### PDF p.71 / printed p.76

ward Non-ionizing Medical Imaging
|: Optical fibre

Basic structure

In modern endoscopy, optical fibres cladding

are the key elements. Nonetheless,
an optical fibre is not complex at all.
In fact, it is simply made of a glass
fibre core surrounded by a cladding core

of a slightly lower refractive index
(Fig. 2.29). Fig. 2.29 Structure of an optical fibre

Working principle

When a light ray enters the core of a fibre, it will eventually
strike the core—cladding boundary. If the angle of incidence is
greater than the critical angle, the ray will be totally reflected
(Fig. 2.30). The ray can then be guided to the other end of the
fibre, even if the fibre is curved (Fig. 2.31).

total internal
reflection occurs

cladding

air

core

greater than
the critical angle

Fig. 2.30 How an optical fibre works Fig. 2.31 A light ray can be guided through a curved optical fibre.

Making your own light guide

Prepare some pure gelatin powder and a rectangular container. Follow the
steps below.

1. Dissolve a small amount of gelatin in hot water and pour the solution
into the rectangular container.

2. Let the solution cool down and a jelly-like block will be formed.
Carefully cut a rod of gelatin from the block and your light guide is done.

4. Direct a laser beam into the guide and observe what happens.

refractive
index

cladding

optical fibre £4

### PDF p.72 / printed p.77

Endoscopy
L as Example 2.6 Maximum entrance angle

The refractive indices of the core and the cladding in an optical
fibre are 1.49 and 1.47, respectively.

cladding

~aoeee>-""

(a) What is the critical angle at the core-cladding boundary?

(b) What is the maximum entrance angle @,,,,, at the end so that

light can be guided along it?

max

B. SOLUTION «000. c ccc ccccccccecececececucececucecucucececucucuceeeces

(a) The critical angle c can be found by

my, 1.49

*. c= 80.602° = 80.6°

(b) For the maximum entrance angle, the angle of refraction at the air core
air—core boundary is 90° — 80.602° = 9.398°.

Applying Snell’s law, we have

1X sin9,,,, = 1.49 x sin9.398°
-*: Ona = 14.08° = 14.1°

WMG cc tesa svepiccnnsncsennne enna

Will the maximum entrance angle increase or decrease if the Ans: decrease
optical fibre is immersed in water?

Checkpoint @
1. State Two criteria for total internal reflection to occur. 3. Inan optical fibre, a light ray is incident on the
core—cladding boundary at an angle smaller than
2. The refractive indices of the core and the cladding the critical angle. Will the following happen?
of an optical fibre are 1.55 and 1.45, respectively. (a) The light ray will completely leak to the cladding.
What is the critical angle 0, at the core-cladding (b) Part of the light ray is reflected.
asic (c) The reflected light ray, if any, makes an angle 0
sin@. = ( ) ~ with the normal such that @ is larger than the

( ) angle of incidence.

### PDF p.73 / printed p.78

orl Non-ionizing Medical Imaging

Endoscope

The capability of guiding light by optical fibres implies the
feasibility of transmitting images. This eventually becomes a
useful application in medical imaging — endoscope.

Structure

In an endoscope, a large number of optical fibres are put
together to form a bundle. There are two kinds of bundles in an
endoscope: coherent and incoherent. The coherent fibre bundle
is used to transmit images while the incoherent (also called non-

coherent) one is used for illumination (guiding light). 4. In other words, the incoherent one

is for sending light to the area under
— . . examination, and the coherent one is for
Apart from channels containing optical fibres, an endoscope sarickcgtollacted lntivhadk ota that
usually contains two more channels. One is used to pass down area.

tools such as forceps for cutting tissues. The other is used to

pass down air or water for inflating and flushing organs, or

cleaning the tip.

When the endoscope is being used, the tube is inserted into

the patient's body. The front end is movable to allow the user

to look around inside an organ. As the tube is flexible, such an

endoscope is also called a flexible endoscope.

control to remove body fluids *’,

magnifying
eyepiece tool channel

4

water/air control

movable section

locking control
to fix tip position

light for pea
illumination \ (( ( ((

Fig. 2.32 An endoscope

PEER RRR REE HEHEHE EE EEEHE THEE EE EEE HEHEHE HEHE HEHEHE HHHHHHHHTEEEEEE EEE EEE EE EEE EEE HEHEHE HEHE HEHEHE AHEHH HEHEHE EEE EEE EEE HEHEHE EEE ED

endoscope PUM coherent fibre bundle AF HMR flexible endoscope FRA ARM

### PDF p.74 / printed p.79

Image formation

A coherent fibre bundle is used to transmit images. The relative
positions of the fibres in the bundle are the same between the
two ends (Fig. 2.33).

When the light from an object is projected onto one end of

the bundle through the objective lens, each fibre transmits the
light incident on its end. As different amounts of light enter the
fibres, the viewer end is illuminated to different extents. The
viewer can then see the image reproduced through an eyepiece
or a camera mounted to the end (Fig. 2.34).

coherent
bundle

incoherent
bundle

Fig. 2.33 Difference between a coherent bundle and an incoherent bundle

coherent fibre bundle

objective lens
(a convex lens)

object

Fig. 2.34 How an image is transmitted by a coherent fibre bundle (the eyepiece is not shown)

Since the organs inside a human body are non-luminous,
another fibre bundle is necessary to send light into the organ.
An incoherent fibre bundle rather than a coherent one is usually
used for illumination because it is cheaper.

Endoscopy

### PDF p.75 / printed p.80

orl Non-ionizing Medical Imaging

Resolution

As we have seen, each fibre in the coherent bundle transmits
light incident on it. Light transmitted in each fibre mixes up and
forms a basic unit of the image that can no longer be resolved.
Therefore, the resolution depends on how closely the fibres are
packed. For a fixed diameter of a bundle, the more and finer the
fibres are packed, the higher the resolution (Fig. 2.35).

Also, the finer the fibres, the more the bundle can be bent.

image formed by
the objective lens resolution: low

bending: less
Fig. 2.35 Bundles with different densities of fibres

Uses

A typical use of an endoscope is
to examine hollow organs, e.g. the Sees
stomach and the colon. The endoscope
is inserted directly into these organs
through natural openings such as the

throat (Fig. 2.36) or rectum.

An endoscope is also used in keyhole
surgery, where only a few small cut
are made in the human body. Surgical
instruments are passed through the
endoscope or through additional small 4 xO S

<4 Atypical coherent bundle has a
diameter between 0.5 mm and 3 mm,
and contains 5000 to 40 000 fibres.

<4 See Ex. Q8 on p. 83.

oesophagus

holes in the body (Fig. 2.37) mx LLL TT TT
— a Tt

### PDF p.76 / printed p.81

Endoscopy

Advantages

An endoscopy has several advantages.

¢ It allows the doctor to inspect the inner surfaces along the
tubes of the body, such as the trachea to the lungs or the
oesophagus into the stomach, through natural openings in
the body.

¢ No ionizing radiation is used.

¢ Itcan be used in keyhole surgery to speed up the recovery
time because only small cuts are made on the patient’s body.

¢ Small tissue samples can be taken out from the body
through an endoscope.

Limitations and precautions

However, an endoscopy has the following limitations and some
safety precautions must be taken.

¢ It requires anaesthesia (iti). Latin, from an- (without) + aesthesis
(sensation). Ensure you remember the
e Itmay require fasting (#*ft) to empty the organs that are word.

going to be examined.

¢ Its field of view is relatively narrow, i.e. only a small area
can be seen at one time.

e Itcan only be used for viewing the inner surface of an organ
with cavity.

¢ Itis invasive, though minimal.

e Inrare cases, it can cause internal bleeding or an allergic
reaction in the patient.

i) Snapshot

Rigid endoscope
Some endoscopes are not flexible. Such an f —
endoscope, known as a rigid endoscope, is —

actually a small telescope and the images
are transmitted by a combination of rigid
lenses. Rigid endoscopes are commonly
used in urology (HR), gynecology (##), T
arthroscopy (#45%%), endoscopic spine light in
surgery etc.

objective head

e eyepiece

### PDF p.77 / printed p.82

orl Non-ionizing Medical Imaging

i) Snapshot GEE

Capsule endoscopy

Capsule endoscopy is a way to take images of the digestive tract (J4/ti8). The
capsule, which weighs a few grams and is about 20 to 30 mm long, contains a
small camera and a few LEDs. After it is swallowed by a patient, the capsule
can take about 50 000 images over 8 hours and send them back to the doctor
through Bluetooth (a wireless technology).

Checkpoint @

1. There are two kinds of bundles in an endoscope. The (a) Which one gives the highest resolution?
bundle is used for illumination (b) Which one can bend the least?
while the bundle is used for

4. True or false:

transmitting images.
6 imag (a) For each optical fibre in an incoherent

bundle, the core has a smaller refractive

2. Which of the following diagrams better represents the index than the cladding.

image as viewed from one end of an endoscope? a a eS ee

A. B. coherent one is used for illumination
because it can transmit light with a smaller
energy loss.

(c) Endoscopy is invasive, though minimally.

(d) An endoscope can also be used in surgery
apart from medical imaging.

5. (a) Theoretically, in a coherent bundle, light rays
entering two individual fibres at the same

3. time may Nor exit at the same time. Why?

(b) Does it affect the images obtained using
endoscope in practice? Why?

### PDF p.78 / printed p.83

Endoscopy

1. The core and the cladding of an optical fibre have 7

refractive indices of 1.55 and 1.45, respectively. What is
the critical angle at the core-cladding boundary?

A. vn (T5735)
B. cos"( 775 - as
D. cos""( 72)

2. A light ray leaks from the core to the cladding in an
optical fibre. The angle of incidence and the angle of
refraction are 15° and 20°, respectively. Which of the
following is the closest to the value of the critical angle
on the core-cladding boundary?

A. 45° B. 50°
C. 60° D. 70°

A coherent fibre bundle of diameter 6 mm contains

10 000 fibres. What is the approximate average distance
between the centres of two adjacent fibres?

A. 0.02 mm B. 0.03 mm

Cc. 0.04mm D. 0.05 mm

4. Which of the following parts is Nor suitable to be

inspected by endoscopy?
A. eye B. lung
C. ovary D. stomach

5. The core and the cladding of an optical fibre have
refractive indices of 1.485 and 1.455, respectively.

cladding

core

cladding

(a) Find the critical angle c at the core-cladding
boundary.

(b) What is the maximum entrance angle i so that
light enters the core from the air and can be
guided through the fibre?

6. There are two kinds of fibre bundles in an endoscope.

(a) What are the differences between them? Briefly
explain.

(b) Which one is used for transmitting images? What
is the typical function of another bundle?

An instrument is inserted into a patient’s colon for
medical examination. Shown below is a series of
photos taken from the outside of the patient's body.

(a) Suggest a possible instrument.

(b) When using the above instrument, there are
some limitations and precautions.
(i) What limits the resolution of the images?
(ii) Suggest one preparation when taking
the above photos.
(iii) Suggest one possible risk when taking
the above photos.

A finer fibre can bend more than a thick one while
light can still be guided through. Go through this
question and see why this is so.

Suppose a fibre has a diameter of D. Its core and
cladding have refractive indices of 1.48 and 1.45,
respectively.

(a) What is the critical angle at the core-cladding
boundary?

(b) The fibre is now bent with a bending radius
R. A light ray originally parallel to the fibre
strikes the inner curved surface of the core
with an angle of incidence i.

cladding
> core

(i) Express 7 in terms of R and D.

(ii) What is the condition that i has to satisfy
such that the light ray is totally reflected
by the internal side of the core?

(iii) Hence, briefly explain why a finer fibre
can bend more, given that the light can
still be totally reflected by the internal
side of the core.

(c) Apart from bending, give ONE MorE advantage
of using finer fibres in a coherent fibre bundle.

83 7~—

### PDF p.79 / printed p.84

2| Non-ionizing Medical Imaging

Summary
Key Ideas

eee eee eee eee eee eee ee eee eee eee eee eee ee eee ee

¢ An.ultrasound scan and an endoscopy are non-
ionizing imaging methods.

Travelling of ultrasound in media

¢ Acoustic impedance Z
¢ How easily the waves travel through a medium
e Formula: Z = pc
(p: density of the medium; c: ultrasound speed
in that medium)
= Adenser medium usually gives a higher
wave speed and hence has a higher Z.
e Intensity reflection coefficient a
¢ When a wave meets a boundary, reflection
occurs. If the intensity of the incident wave is
1 unit, the intensity of the reflected wave is
a unit (a <1).

¢ Formula: @ =

e If the intensity of the incident wave is 1 unit, the
transmitted wave is 1 - a unit.

= Two materials with a large difference of Z
(i.e. a is large) gives more reflected waves
on the boundary.

e => Attenuation

¢ Intensity drop of the waves when passing
through a medium (due to energy loss and
scattering)

¢ Depends on material and frequency of waves
¢ Stronger with higher frequency

eee eee eee eee eee eee eee eee eee eee eee eee ee eee eee)

Ultrasound scan

¢ Principle: pulse-echo technique / detecting echoes
from different boundaries

2

tissue 1 tissue 2

time =0

tissue boundary

time =-

tissue boundary

skin tissue boundary

¢ Larger difference in Z in two materials gives
stronger echoes from the boundary.
= Coupling medium is applied to patient's skin to
avoid loss on the air-skin boundary.

¢ Echoes from deeper boundaries return at a later
time.

= Depth of the boundary (with wave speeds
known) can be found.

### PDF p.80 / printed p.85

Summary

¢ Tools: piezoelectric transducer (device for both producing and detecting

ultrasound)

¢ Emission of ultrasound

original shape

ultrasound
emitted

changing voltage

1. Voltage is applied across
the crystal > crystal
changes its shape

| 2. Voltage is removed ~ crystal

restores its shape through a => 3. Ultrasound is emitted
series of oscillations

¢ Detection of ultrasound

original shape

erates

1. Crystal changes its
shape by ultrasound =

2. Voltage is developed = 3, Ultrasound signals are detected
across the crystal through measuring pd

¢ =6Types:
¢ A-scan (amplitude scan):
Amplitude of echoes against time
¢ B-scan (brightness scan):

¢ Choosing frequency ranges for scanning

1. Resolution

Stronger intensity, brighter dots incident pulse reflected pulse
amplitude
brightness ;
axial
—o.-e_#e--
Axial resolution: higher for shorter
e 2-DB-scan pulse duration

Lateral resolution: higher for higher frequency

Send out multiple beams of When traces are joined, scastins :

A PIS SR RSET =) a planar image ts formed. 2. Penetration: higher frequency suffers higher

attenuation

¢ Advantages and limitations: see p. 72

### PDF p.81 / printed p.86

orl Non-ionizing Medical Imaging

Endoscopy

¢ Working principle: guiding light through an optical
fibre with multiple total internal reflection

cladding

core

¢ Optical fibre: a glass core of higher n surrounded by
a cladding of lower n

¢ Tools and mechanism (see p. 78)

control to remove body fluids 3} ee

magnifying
eyepiece tool channel

water/air control

locking control
to fix tip position

light for

illumination CO .

~ grasping forceps

¢ How images are formed ¢ Resolution tT with higher fibre density

1. The surface under examination is illuminated by
the light coming from the incoherent fibre
bundle.

2. Light from objects enters the objective end of the
coherent fibre bundle.

3. Animage is reproduced on the viewer end of

the fibre bundle. resolution: low high
bending: less more

¢ Advantages and limitations: see p. 81

### PDF p.82 / printed p.87

Summary =

Keywords

A-scan A fifi intensity reflection coefficient 2} 3 HR
acoustic impedance # Hit lateral resolution Bil] > BF 4

attenuation fim optical fibre 165

axial resolution #il9]4} HF piezoelectric effect MEM

B-scan B #ifiti pulse-echo technique Pk [1 #¢ FE A
coherent fibre bundle ti 76a K resolution 4} 3%

coupling gel fia sé transducer +4 fie #

endoscope |) 8% ultrasound if #isk

endoscopy \4i SLB tft ultrasound scan i SF ise AR AM

flexible endoscope ©] (iN BLBE

Common Mistakes

eee ee eee eee ee ee)

° B-scan image ° two bundles of

Qiis dark optical fibre
*‘” more waves
must have

been absorbed

*.” fewer waves
are reflected
higher resolution, higher resolution, but

MM A dark area in a B-scan image represents the area brighter image brightness depends
that reflects a smaller amount of ultrasound waves. sien anes

This area does not necessarily absorb more waves.

Pis bright
*.” more

waves are
reflected

@ The brightness of an image as seen through an
optical fibre bundle depends on the total
cross-sectional area of the fibre. A higher fibre density
does not ensure a brighter image.

### PDF p.83 / printed p.88

ward Non-ionizing Medical Imaging

Chapter Exercise

Multiple-choice Questions

eee eee eee eee eee eee eee eee eee eee eee eee ee eee eee)

Which of the following statements about the acoustic
impedance of a medium is/are INCORRECT?

(1) It depends on the density of the medium.

(2) It depends on the sound speed in the medium.
(3) Itdepends on the thickness of the medium.

A. (1) and (2) only B. (1) and (3) only

C. (2) and (3) only D. (1), (2) and (3)

Given that the intensity reflection coefficient between
fat and liver is 1%. Estimate the acoustic impedance
of liver if the acoustic impedance of fat is

1.38 x 10°kg m*s"

A. 1.6x10°kgm*s'  B. 1.7*«10°kgm’s!

C. 1.8 10°kg m*s" D. 1.9 10°kg m*s"

Which of the following diagrams best illustrates how
an ultrasound scan is carried out?

ultrasound ‘2 %

ultrasound |
| detector

detector

ultrasound / }

\ ultrasound | :
on detector (inside

detector ies body)!

An acoustic shadow may sometimes be seen on an
ultrasound image. Shown below is a photo of a
salivary stone (pointed by the arrow) found around a
salivary gland. An acoustic shadow appears beneath
the salivary stone. Given that the transducer is
located at the top of the photo.

Which of the following statements about the shadow

must be correct?

(1) The acoustic impedance of the region in the
shadow is very high.

(2) Ultrasound of a very low intensity is
transmitted into the shadow.

(3) Most ultrasound is reflected by the front surface
of the object that creates the shadow.

A. (1) and (2) only B. (1) and (3) only
C. (2) and (3) only D. (1), (2) and (3)

The figure below shows an ultrasound image of a
foetus of 12 weeks.

Which of the following statements about the image
is/are correct?

(1) Itis an A-scan image.

(2) The brightest areas are regions where
ultrasound is most attenuated.

(3) The transducer is placed above the top of the

image.
A. (1) only B. (3) only
C. (1) and (2) only D. (2) and (3) only

Which of the following combinations best describes
the frequencies of ultrasound used for medical
imaging of the breast and the kidney?

breast kidney
A. 100 kHz 400 kHz
B. 400kHz 100 kHz
C. 4MHz 10 MHz
D. 10MHz 4 MHz

The refractive index of the cladding of an optical
fibre is 1.46. It is known that the critical angle at the
core-cladding boundary is 75.5°. What is the
refractive index of the core?

A. 1.41 B. 1.43
Co: al D. 1.53

### PDF p.84 / printed p.89

10.

11.

A coherent fibre bundle contains 10 000 fibres. Given
that the average distance between the centres of two
adjacent fibres is 0.05 mm. What is the approximate

diameter of fibre bundle?

B. 0.6mm
D. 6mm

0.3 mm

3mm

Which statement about fibre optic endoscopes is

INCORRECT?

A coherent fibre bundle is mainly used for
transmitting images.

Light travels more slowly in a non-coherent
fibre bundle, as compared with its speed in a
coherent bundle.

Both coherent and non-coherent fibre bundles
can function normally when bent slightly.
The relative positions of the fibres at the two
ends inside a coherent fibre bundle are the
same.

Which of the following are the advantages of using

endoscopy?

(1)
(2)
(3)

HKDSE 2012 The

diagram shows a object
coherent bundle of

optical fibres consisting

of 36 square elements.
The bundle is used for

Endoscopy is non-invasive.

No ionization radiation is involved.

Samples of tissues can be taken out of the organ

being examined.
(1) and (2) only B.
(2) and (3) only D.

(1) and (3) only
(1), (2) and (3)

viewing the object shown (Drawing is not to scale).

Which of the following best represents the picture as

viewed by the observer?

Chapter Exercise So.

HKDSE 2012 The figure shows an ultrasound
B-scan image. Which statements are correct?

(1)
(2)

(3)

X is closer to the scanner than Y.

Area Z is low in brightness because it absorbs

more ultrasound.

Area W is high in brightness because it reflects
more ultrasound.

(1) and (2) only B.
(2) and (3) only D.

(1) and (3) only
(1), (2) and (3)

HKDSE 2013 The diagram below represents two

coherent optical fibre bundles X and Y used in

endoscopes. Their cross-sections have the same

dimensions but X has more and finer fibres. Which

statements are correct?

++++++4
+++++e4
+++ 4
+++4+444
++++4+44

xX x

X gives a much brighter image than Y.

X can be bent more than Y.

X gives an image of higher resolution than Y.
(1) and (2) only B. (1) and (3) only
(2) and (3) only D. (1), (2) and (3)

HKDSE 2013 Which of the following statements
about ultrasound medical imaging is/are correct?

(1)

(2)

(3)

Ultrasound is potentially hazardous as it is a
form of ionizing radiation.

Ultrasound is Nor suitable for lung scanning as
it is almost totally reflected when it reaches the
tissue—air boundary in the lungs.

High frequency ultrasound has a greater
penetrating power but provides images of lower

resolution.
(1) only B. (2) only
(1) and (3) only D. (2) and (3) only

839 -—

### PDF p.85 / printed p.90

ward Non-ionizing Medical Imaging

15. HKDSE 2014 An ultrasound transducer is placed

on the skin over a certain position of the human
body to perform an A-scan. The signal received
contains two spikes P and Q as shown. Which of the
following statements is/are correct?

ultrasound
transducer

(1) There is almost no reflection from interface Y
because the bone absorbs nearly all of the
ultrasound,

(2) There is almost no reflection from interface Y
because interface X reflects nearly all of the
ultrasound.

(3) The spikes P and Q correspond to the reflections

at interfaces X and Y respectively.

(1) only B. (2) only

(1) and (3) only D. (2) and (3) only

Structured Questions

eee eee eee eee eee eee eee eee eee eee eee eee eee eee eee eee eee

16. The photo below shows a patient receiving

— 90

ultrasound scan for his thyroid.

(a) Should high frequency (> 5 MHz) or low
frequency (<5 MHz) be used for the scan?
Briefly explain why. (2 marks)

(b) Suggest one advantage of using ultrasound
rather than X-ray imaging scan to diagnose the

thyroid. (1 mark)

17.

(c) Shown below is a photo of the scan image.

(i) There are some bright and dark regions in
the image. Briefly explain how they are

formed. (2 marks)

(ii) A suspicious structure is noticed (pointed
by the yellow arrow). How large is it (the
lengths of the yellow dotted lines)? The
width of the photo represents a length of

4cm. (2 marks)

(d) Sometimes, ultrasound scan may falsely
determine the position of a structure. Shown
below is a possible situation.

transducer

(i) Name the phenomenon that causes the
(1 mark)

false determination.

(ii) Compare the ultrasound speeds in tissues
X and Y. (1 mark)

The figure below is an A-scan CRO trace, which
shows the echoes from boundaries X and Y inside
a human body.

transducer

muscie

### PDF p.86 / printed p.91

18.

(a) The transducer is responsible for generating and
detecting ultrasound pulses.
(i) Name the effect applied to the detection of

ultrasound pulses. (1 mark)

(ii) Briefly describe how the transducer can
generate and detect ultrasound. (2 marks)
(b) The echoes from boundaries X and Y have
different intensities. Suggest Two reasons.
(2 marks)

(c) Ultrasound has speeds 1550 m s'and 1450ms"!
in the muscle and the fat, respectively. The

density of the fat is 950 kg m™.
(i) How thick is the layer of muscle? (2 marks)
(ii) Find the acoustic impedance of the fat.
(1 mark)
(iii) When the ultrasound pulse crosses
boundary X, its intensity drops by 0.7%.
Neglecting any absorption of energy by the
media, estimate the density of the muscle.
(2 marks)

In an ultrasound scan,
a device X is used to

device X

produce ultrasound

pulses and to detect A

the echoes. The 160m

device is in contact B
2cm

with the skin. A bone
of thickness 1.2 cm is
1.6 cm below the skin. A, B and C are the boundaries

air-soft tissue, soft tissue-bone and bone-soft tissue,

respectively. The ultrasound speeds in soft tissue and
bone are 1500 ms” and 4000 m s", respectively.

(a) Name device X. (1 mark)

(b) Calculate the time taken for an ultrasound pulse
to travel from

(i) boundary A to B.
(ii) boundary B to C.

(2 marks)
(1 mark)

(c) The figure below shows a CRO trace of a pulse
received after its reflection from boundary A.
The time-base setting is 4.0 tts per division.

+1
CRO trace 4.0 us

Chapter Exercise Ds

(i) Complete the CRO trace to show the
reflected pulses from boundaries B and C.
Neglect the amplitude change of the

echoes. (2 marks)

(ii) If the gel is Nor applied, how does your
answer in (c)(i) change? Briefly explain.
(2 marks)
(d) The intensity reflection coefficient on boundary
B is 35%. What is the density ratio of the bone to
the soft tissue? (2 marks)

19. The figure below shows an axial cross-section of an

optical fibre. The core is made from glass with a
refractive index of 1.5. The critical angle at the core—
cladding boundary is 85°.

5 cladding

core

cladding

(a) Complete the following graph to show how the
refractive index changes with the radial distance

along the line AD. (2 marks)

refractive
index

4
2.05

1
1.05

0.5-

0 T T T Lag

A B Cc D radial distance

(b) What is the value of the maximum angle of
incidence i if the incident light ray has to be
totally reflected on the core-cladding boundary?

(2 marks)

(c) Such fibres are bundled in an endoscope to
transmit images. Illustrate, with the aid of a
diagram, how images can be transmitted.

(4 marks)

(d) Give one advantage and one limitation of

endoscopy. (2 marks)

### PDF p.87 / printed p.92

orl Non-ionizing Medical Imaging

20. Read the following article about endoscopic

21.

ultrasound and answer the questions that follow.

Endoscopic ultrasound

Endoscopic ultrasound (EUS) combines
endoscopy and an ultrasound scan to obtain
images of the internal organs in the chest and
abdomen.

In EUS, a small ultrasound transducer is installed
on the tip of the endoscope. By inserting the
endoscope into the upper or the lower digestive
tract, one can obtain images of the organs

inside the body. Since the EUS transducer

is placed close to the organs of interest, the
images obtained are generally more accurate
and more detailed than the ones obtained by a
conventional ultrasound scan.

EUS can also obtain information about the
layers of the intestinal wall as well as adjacent
areas such as lymph nodes and the blood
vessels. Cancer staging of some organs, e.g.
the oesophagus, stomach and lung, using EUS
is becoming popular. This is because EUS can
provide useful information regarding the depth
of penetration of the cancer and the spread of
cancer to adjacent tissues and lymph nodes.

(a) Briefly explain why a conventional ultrasound
scan CANNOT be used to obtain images of the
stomach or intestine. How can images of such
organs be produced with EUS? (3 marks)

(b) Based on your knowledge about endoscopy,
suggest ONE limitation and one possible risk to
patients using EUS. (2 marks)

IB Higher level Nov 2011 This question is about the
use of ultrasound for diagnostic imaging.

(a) Outline how ultrasound is produced for use in
(3 marks)

(b) In order to look for damage to the chambers of
the heart, ultrasound is used to form an image

diagnostic imaging.

of the heart.
Suggest why it is better to use ultrasound rather
than X-rays. (2 marks)

(c) The speed of sound in skin is about five times
the speed of sound in air. Given that the density
of skin is about 700 times that of the density of
air, compare the acoustic impedance of skin to
that of air. (2 marks)

(d) Explain, using your answer to (c), why, in using
ultrasound for imaging, a layer of gel is placed
between the transducer and the skin. — (2 marks)

(e) Awide range of frequencies of ultrasound may
be used to image internal body organs. The
choice of frequency for imaging a particular
organ is determined by the depth of the organ
beneath the skin.

Outline, with reference to attenuation and

resolution, why the depth of the organ

determines the choice of ultrasound frequency.
(4 marks)

22. IB Higher level May 2012 This question is about

ultrasonic imaging.

(a) Describe how a piezoelectric crystal in an
ultrasound transmitter is made to generate a
pulse of ultrasound. (2 marks)

(b) The table gives the velocity of sound in, and the
densities of, the materials.

velocity of ey
sound / eee At

=3
ms”! kgm

acoustic
impedance

gel

muscle
tissue

(i) State the SI unit for acoustic impedance.
(1 mark)
(ii) Calculate the acoustic impedance for each
material and write your answers in the
table above. (2 marks)

(iii) The fraction of the reflected intensity when
ultrasound in a medium of impedance Z, is
incident on a medium of impedance Z, is
given by the following equation.

This is called the reflection coefficient.
Calculate the reflection coefficient for
ultrasound that is incident on muscle tissue

from air. (2 marks)

### PDF p.88 / printed p.93

(iv) Using your answer to (iii), explain why it is
necessary to use gel in between an
ultrasound transducer and a patient's skin.

(2 marks)

23. AQA A-level PHYAS Jun 2013

The figure shows an ultrasound transducer used
in an A-scan.

metal case backing material

electrodes

piezoelectric
crystal

plastic membrane

co-axial
cable

acoustic insulator “ar

Outline, with reference to the diagram, the
process by which the transducer produces a
short pulse of ultrasound. (4 marks)
Ultrasound is incident on the boundary between
two materials. Some of the ultrasound is
reflected at the boundary and the remainder is
transmitted across the boundary. The ratio of the
intensity of the reflected ultrasound, /,, to the
intensity of the incident ultrasound, |; , is given
by the equation

I (Z, _ Z,)*

i (Z,+Z,)

where Z, and Z, are the acoustic impedances of
the two materials.
(i) Calculate the percentage of the incident
ultrasound which would be transmitted
into the skin when incident on an air-skin
boundary. (2 marks)

acoustic impedance of air

= 4,29 x 10?kg m*s!

acoustic impedance of skin

= 1.65 x 10° kg m* s"
When obtaining the ultrasound image of an
unborn foetus, a coupling gel is used.
Explain why a coupling gel is needed and
state the property of the gel that ensures a
(2 marks)

good quality image.

24.

Chapter Exercise Ds

HKDSE 2012

The figure shows a cross-section of a piece of
bone with 5.8 cm thickness situated below a
layer of soft tissue that is 2.0 cm thick. An
ultrasound transducer with coupling gel is
applied to the skin. The ultrasound pulses
reflected from various boundaries A, B and C

are displayed on a CRO.
ultrasound
transducer
coupling gel skin
2.0 cm
soft
5.8cm tissue

5; ae t b ¢ Ff F
i ee ee
a a oe oe oe oe

ie teed Met del Bet ee ee ee
es ee

(i) Find the ratio of the speed of ultrasound in

bone to that in soft tissue. (2 marks)
The values of acoustic impedance of various
body tissues to the ultrasound used are
tabulated below.

acoustic impedance /

tissues kgm?”
soft tissue (average) 1.63 x 10°
bone 7.78 x 10°

(ii) If the speed of ultrasound in soft tissue is
1580 ms", estimate the density of bone.
(3 marks)
(i) Describe the working principles of
ultrasound B-scan imaging. (3 marks)
State one advantage and one limitation of
using ultrasound scans in the context of

medical imaging. (2 marks)

