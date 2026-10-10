# OCR transcript: Active Physics Book 9 (Medical Physics elective), Chapter 3 — Ionizing Medical Imaging

Intake only. Never shown to students and never shipped (the root `.dockerignore` drops `notes/_source/`).

## Front matter

- **Source PDF:** `active-physics/book-9.pdf` (138 pages; image-only scan, no text layer). Copied read-only into the gitignored `paper2notes/active-physics/`.
- **Pages used:** PDF pp.89–138 = printed pp.96–145. Printed page = PDF page + 7 for this chapter. The chapter opener (printed pp.94–95) is not in the scan. PDF p.138 is a blank page.
- **How chapter boundaries were identified:**
  1. PDF p.89 opens "3.1 X-rays and radiographic imaging"; running headers read `3 Ionizing medical imaging`.
  2. Section banners: "3.2 Computed tomographic scan" (PDF p.102), "3.3 Radionuclide imaging" (PDF p.109), "3.4 Safety precautions for ionizing radiation" (PDF p.122), "3.5 Comparison of imaging methods" (PDF p.127).
  3. PDF pp.128–130 are "Summary"; PDF pp.131–137 are "Chapter Exercise". The book ends at PDF p.138.
- **OCR method:** `pdftoppm -r 200 -png` per page, then Tesseract 5.5.3 `-l eng`. Table 3.1 (attenuation coefficients), Table 3.4 (doses) and every formula were checked against the page images.
- **QB bank:** `QB_E403` (60 items: 38 MC, 9 SQ, 13 LQ; ids `PHY1903…`) is the publisher bank for this chapter.
- **DSE classification:** none (elective, Paper 2; not held by `paper2db`).

## Transcript (raw OCR per page)

### PDF p.89 / printed p.96

[fe X-rays and radiographic

imaging

Some medical imaging methods involve ionizing radiation, in
contrast to those learnt in the previous chapter. We shall discuss
these methods and the corresponding safety measures.

lonizing radiation

lonizing radiation is ionizing because it has very high energy
and can ionize an atom or molecule (Fig. 3.1). It is hazardous
because it can damage and even kill living tissues.

atom positive ion

ionizing radiation > i) =)

‘knocking’ out
an electron

2 Fig. 3.1 lonizing radiation can
electron ‘knock’ electrons out of an atom.

For electromagnetic waves (EM waves), the higher their
frequencies, the more energy they carry. Those with frequencies
higher than ultraviolet radiation, i.e. X-rays and gamma rays,
are ionizing (Fig. 3.2).

radio | micro- infrared uv X-rays gamma
waves | waves I rays
Ul i tT : | ae ne i
10° 10” 10° 10™ 10" 10" 10” frequency / Hz

Fig. 3.2 Electromagnetic spectrum

Since ionizing radiation usually has a small size (in the form of
particles) or a short wavelength (in the form of waves), it can
penetrate deep into a material.

im Enrichment

Energy of ionizing radiation

The energy to ionize a hydrogen atom is 13.6 eV (~2 x 10°" J). The energy
E carried by electromagnetic waves of frequency f can be calculated by

E = hf, where h = 6.63 x 10°* J s (also known as Planck's constant).
Therefore, electromagnetic waves with a wavelength shorter than 100 nm
or a frequency higher than 3 x 10'° Hz are ionizing.

PEER RRR E HEHEHE HEHEHE TEETH HEHEHE EEE EEE HEHE EEE HEHEHE HEHEHE HEHEHE HEHEHE HTE HEHE EEE EEE HEHEHE EEE EEE HEHE HEHEHE EHH HEEEEEEEEEEEHEEEEE EEE EEE EEE ED

ionizing radiation RRMA

### PDF p.90 / printed p.97

X-rays and radiographic imaging

[) X-rays

Nature

X-rays are EM waves of high frequencies. They are a common
type of ionizing radiation. Like visible light, X-rays can blacken
a photographic film through chemical reactions. X-rays are
usually characterized by frequency (measured in Hz) or energy
(measured in eV, 1 eV = 1.60 x 5 J):

Frequency range—10"° to 10" Hz
Energy range—100 eV to 100 keV

Production of X-rays

X-rays are produced when high-speed electrons hit a heavy
metal target. During the hit, the electrons decelerate rapidly and
some of the KE taken away from the electrons is released in the
form of X-rays (Fig. 3.3).

heavy metal target

electron gun

Fig. 3.3 X-ray tube (left) and how it produces X-rays (right)

Snapshot

Rotating X-ray tube

When electrons hit the anode (the metal target) in an X-ray
tube, intense heat, along with X-rays, is produced. To facilitate
heat loss and improve the service life of an X-ray tube, the
anode is shaped into a disc and made to rotate at a high
speed. This effectively spreads out the heat produced over a
larger area of the anode. As a result, the service life of the
X-ray tube can be lengthened.

SAREE ERROR HEHEHE H HEHEHE HEHEHE HEHE EEE HEHE EEE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHEHE HEHE EEE EEE EEE EEE HEHEHE HEHEHE EEE HEHEHE HEHEHE

### PDF p.91 / printed p.98

oo lonizing medical imaging

Attenuation

When a beam of X-rays travels in a medium, its intensity
gradually decreases, similar to that of ultrasound. This process
is also called attenuation and it has similar causes.

Causes and factors

First, you should now know that X-rays are ionizing and an
X-ray beam will lose energy as it ionizes the medium during its

travel.
Second, X-rays are scattered when they travel in a medium. 4. scattered = bounced off (actually
absorbed and re-emitted) in random
electrons aan
¢” ane wn
SSS LSS SITS
a ane anne
SASS  aaaed SIS LISS
SY a OLLSS LSS er
© nnn nn
LLL VY LISS
ce, ne OOnNRNe
ionization scattering
Fig. 3.4 Attenuation of X-rays
In general, X-rays are attenuated more by a Barta Falecobirpense
10°44 coefficient / cm:
medium in the following situations: 10°4 ar
< - , 2 20 keV X-rays calmed tf 1 Pee died
e The density of the medium is higher. . (-0.5x10"Hz) jf aN
¢ The atomic number of the element that 19 oeo"
makes up the medium is larger. 10" o"
1p? 60 keV X-rays
¢ The X-rays have a lower frequency 10°4 (~1.5 x 107 Hz) ————
(i.e. less energetic) and are more easily ier T T gs
3 10 30 100
scattered.

Fig. 3.5 An X-ray beam is attenuated more by a medium if the atomic
number of the element is larger or it has a lower frequency.

Linear attenuation coefficient

Suppose there is an X-ray beam of initial intensity J). After it
travels in a uniform medium for a distance of x, its transmitted

intensity will drop to J. These quantities are related by % Note the negative sign. Since ys and x are
positive, the presence of the negative
sign ensures the expression decreases as
x increases.

i=nlze™ Compare: e' =2.7 and e' =1/e=0.37
e’=7.4 ande’=1/e’=0.14
e° = 20.1 and e° = 1/e’ = 0.05

PERE RERRRRRRREEEHHEE HEHE EEE EEEE THEE EEE EEE EEE EEE HEHEHE HEHEHE HEHEHE HEHEHE HEEHTEES EEE EEE EE EEE EEE EEE HEHEHE HEHE HEHEHE HEHEHE EEE EEE EEE E HEHEHE HEHEHE

attenuation R&R

### PDF p.92 / printed p.99

where 1 is called the linear attenuation coefficient and its unit

iscm'. The larger the coefficient, the faster the X-ray beam is
attenuated to a lower intensity (Fig. 3.6).

160 80 40
as > - ee
——=—=—- smal —- = -—= Wt
=p apap ap fe > — = 7
= |< | 1

160

X-rays and radiographic imaging

AL lcm? =100m"=0.1 mm"

40 10
ee ee = 0.5-
> ee —_ a gages ne
eee ee ee = ' I
eo —- T T
" Xy Oxy

Fig. 3.6 How the intensity (in arbitrary units) of an X-ray
beam changes in two different media

Half-value thickness

If we plot a graph of | against x (Fig. 3.7), we can see that the

intensity decreases by half when it travels a definite distance.

This distance is called the half-value thickness (x,, or HVT).

In other words, blocks of x,,, 2x,, and 3x,, thick can reduce
the intensity to 1/2, 1/4 and 1/8, respectively. In practice, the
transmitted intensity becomes negligible if the block is 10x,
thick and we may say that the X-ray beam dies out.

Now, let us study the relation between x,, and wu.

When the intensity is halved, i.e. I/Iy = 1/2,
1
2

“MX = In2

Rearranging the above, we have

In2

42> 7

We can see that the larger the linear attenuation coefficient p,
the smaller is the HVT.

SERRE EERE EERE HHH RHEE HEHEHE AHHH HEHEHE EEE EEE EEE EE EEE EEE HEHEHE EEE HEHEHE HHH HEHEHE EEE E HEHE EEE EES

linear attenuation coefficient RRMFR _ half-value thickness #492

Fig. 3.7 Intensity / against travelling distance x

% Note that the J/Ip graph is a curve, but
the Ln (I/Iy) graph is a straight line with
negative slope -p:

l=le* = in(7-)=—H “x

———_ See

¥ slope
also called half-value layer (HVL)

% Compare HVT with half-life:

HVT = the thickness for the value to fall
by half

Half-Life = the time for the value to fall
by half

Note that the T stands for thickness
(distance), not time.

A In(e*) =-y

in($) =-tn2

<4 This means

l=1,-e*= Io(5)
where n is the number of HVTs:

Xin

eee eee eee ee eee ee eee eee eee PCCP eee eee eee eee eee

### PDF p.93 / printed p.100

Onl lonizing medical imaging

The linear attenuation coefficients and HVTs of some materials

are shown.

50 keV X-rays 100 keV X-rays
materials :
air 0.000 27 | 2600 0.000 20 | 3500 4 Note that the attenuation of X-rays in air
fat 0.19 3.6 0.16 3.9 ReMeRry oa
water 0.22 3.2 0.17 4.1
soft tissue 0.23 3.0 0.16 3.9
compact bone 0.57 Ts 0.30 ys
lead 88 0.0079 62 0.011

Table 3.1 Linear attenuation coefficients and HVTs for some materials

Li mp Example3.1 Y Attenuation of X-rays

The intensity of an X-ray beam is initially 60 MW m°. The half-
value thickness of aluminium for the X-rays is 2.5 mm.

(a) Ifa4mm aluminium filter is used to attenuate the beam, what
is the transmitted intensity of the beam?

(b) What would your answer be if the thickness of the filter is
increased to 8 mm?

i SOMO scspccgrccomspro nnn a emmNeT
(a) Applying X= ~ the linear attenuation coefficient is

In2

= == =0.2773 mm! 4 If the unit of HVT is mm, the unit of
2.5 the coefficient y is mm”.
The transmitted intensity is | = (60)-e ©?” = 19.79
=19.8 MW m™.
(b) The intensity is (60)-e ©?” = 6.53 MW m™. % Note that the intensity is not halved

when x is doubled in general cases,

Snapshot

Aluminium filter

When taking X-ray images, an additional aluminium filter, say 1 to 2 mm
thick, is often placed in front of an X-ray tube to absorb the X-rays of lower
energy. This can reduce the radiation dose absorbed by the patient since
the X-rays of lower energy cannot penetrate the patient to form any images
but will be absorbed by the skin of the patient.

### PDF p.94 / printed p.101

im Enrichment

Linear mass attenuation coefficient

Often, the linear mass attenuation coefficient (p,,,) is
used instead of the linear attenuation coefficient:

Um = u/p
where p is the density of the medium. In general, p/,,

depends on the energy of the X-rays and the composition

of the materials but not the density. Substituting the
above into the equation / = /,-e ™, we have:
1 = Ig: @ MnP

The new formula suggests how the density of a material
affects attenuation.

Checkpoint @

The half-value thickness (HVT) of a material is

A. directly proportional to the linear attenuation
coefficient of the material.

B. inversely proportional to the linear attenuation
coefficient of the material.

C. half of the distance travelled by an X-ray beam
after which its intensity is reduced to zero.

An X-ray beam has an initial intensity of 80 MW m®.
When it travels in medium A for a distance of 2 m, its
intensity is reduced to 20 MW m®.

(a) What is the HVT of medium A?

(b) What is the intensity of the beam when it has
travelled in medium A for 3 m?

An X-ray beam has an initial intensity of 8 W mm*.
It travels in medium B for a distance of 50 mm.
Suppose B has a linear attenuation coefficient of
0.02 mm. What is the transmitted intensity?

By [=1,e*", the transmitted intensity is

( ye’ u Dag

A beam of X-rays travels in a certain material.
True or false:

(a) The intensity of the beam decreases
exponentially as the ray travels.

(b) The half-value thickness of the material
decreases exponentially as the ray travels.

5. The graph below shows how the intensity / of an

X-rays and radiographic imaging

water 1 0.22 0.22
ice 0.92 0.20 0.22
steam 0.000 60 0.000 13 0.22

For example, water, ice and steam have the same mass
attenuation coefficient. However, they have different
densities and thus different thicknesses are needed to
attenuate the X-rays to the same degree.

(c) The linear attenuation coefficient of the
material decreases exponentially as the ray
travels.

X-ray beam changes when it travels through a
distance x in a material. The initial intensity of the
X-ray beam is [. Can the following quantities be
determined from the graph? If yes, what are the

values?
0.8
0.6
0.4 +--+ (eee eee ~
aces }
0.24-— $< +-—-—}-——
PSS
0 T a
0.25 0.5 0.75 1 1.25 y fe:
x/em

(a) Half-value thickness of the material
(b) Linear attenuation coefficient of the material
(c) Density of the material

### PDF p.95 / printed p.102

orl lonizing medical imaging

b) X-ray radiographic imaging

From the previous discussion, we should realize that X-rays are
attenuated to different degrees when passing through different
materials. How is this related to producing X-ray radiographic
images?

Fig. 3.8 X-ray radiographic images: hand (left) and breast (right)

Working principle

To understand how an X-ray image is created, we may draw
an analogy between visible light and X-rays. Suppose an object
is behind an umbrella. We cannot see it as our sight is blocked.
However, if intense light comes from behind, a projection of
the object can be seen. In fact, an X-ray radiographic image is a
projection of the structures inside our body.

4s \ Fig. 3.9 What is behind the umbrella?

Fig. 3.11 An X-ray radiographic
image is a projection of the
structures inside our body.

PEER R ERR RRR E EEE E EEE E HEHEHE HEHE EEE EEE EEE E HEHEHE HHH H HEHEHE EE EHHEHEE EEE EEE EE EE HEHEHE EEE EEE HEHEHE HEHEHE HHEEEEEEEEEEEHHEEEE EEE EEE HEHEHE EEE

### PDF p.96 / printed p.103

X-rays and radiographic imaging

When an image is taken, an X-ray beam is emitted from an X-ray

tube and passes through our body. Since our body consists of

tissues which have different compositions and thicknesses,

X-rays are attenuated to different degrees. As a result, X-rays

of different intensities will emerge from the body. These X-rays

can then be visualized using X-ray detectors such as films and % A film exposed to X-rays turns black.
imaging plates.

incident X-rays body emergent X-rays film
; 2
bone
soft tissue :

Fig. 3.12 X-rays are attenuated when passing through our body.

By convention, the more X-rays the detector is exposed to, the
darker the image that is produced. Put another way, the more
an X-ray beam is attenuated by a human body, the lighter the
image that is produced. The table below shows how various
media in our body appear on an X-ray image.

medium | attenuation | appearance on the image
air negligible black
fat small dark grey
soft tissue medium grey
bone high white

Table 3.2 How various media in our body appear on an X-ray image

re. | a

Take a chest X-ray image as an example (Fig. 3.13). The spine

(bone) appears white. The lung appears black as it contains
mostly air. The heart, made up of soft tissues, appears grey.
Obviously, the image provides a high contrast between bones
and neighbouring soft tissues.

The formation of a radiographic image is the result
of the different degrees of attenuation of X-rays by

different body tissues.
Fig. 3.13 Chest X-ray image

103 -—

### PDF p.97 / printed p.104

Onl lonizing medical imaging

[SSSEEEIEEIA contrast

Two identical X-ray beams pass through two tissue layers
P and Q, which have the same thickness but a different
composition. It is known that P has a greater linear
attenuation coefficient.

(a) Which beam is attenuated more, the one that passes
through P or Q?

(b) The initial intensity of the X-ray beams is 50 MW m*.
The layers are 2 cm thick. The linear attenuation
coefficient of P is 0.200 m™.

(i) What is the transmitted intensity of the beam that has
passed through P?

(ii) If P and Q attenuate X-rays by very similar degrees, the
grey areas on the film may have similar colours and the
contrast would not be sharp enough to be distinguished.

Suppose in this case, there is enough contrast if the
intensities of the emergent X-ray beams from P and

Q differ by 0.05 MW m®. Find the maximum linear
attenuation coefficient of Q such that enough contrast is
provided.

B. SOLUTION 2020. c ccc ccccececccecececececececucucecucecucucececuees

(a) The beam that passes through P is attenuated more as its linear
attenuation coefficient is larger.

(b) (i) The thickness of layer P is 2 cm = 0.02 m.
Applying I = lye“, the transmitted intensity is
(50) « (0-70) = 49.80 = 49.8 MW mm”,

(ii) The minimum intensity of the X-ray beam that has passed
through Q should be 49.80 + 0.05 = 49.85 MW m*.
Applying | = I,e'", we have

49.85 = (50)-e 4a 0™)
0.997 = e7 He)
1.003 = e#e'0™)
Hg: (0.02) = In (1.003)
Ho = 0.1498 m™

The maximum linear attenuation coefficient of Q is
0.150 m™.

contrast
high enough

contrast not
high enough

### PDF p.98 / printed p.105

X-rays and radiographic imaging

Artificial contrast medium

We can clearly distinguish bones from neighbouring soft tissues

in an X-ray image as their contrast is sharp. But if we want to

distinguish soft tissues from one another, X-ray imaging is not a

good choice. 4 Their contrast is not high enough.

However, for certain organs, it is still possible to make them
temporarily opaque by using an artificial contrast medium.
Such a medium is actually a compound with a large linear
attenuation coefficient. It can be taken orally or injected into the

body.
soft tissue soft tissue
bone artificial

contrast
medium

(a) Sharp enough natural (b) Not sharp enough (c) Using artificial contrast

contrast natural contrast medium to increase the contrast

Fig. 3.14 Use of artificial contrast medium

For example, a stomach and its nearby tissues have similar
linear attenuation coefficients. To produce sharp contrast, a
patient can take in orally an artificial contrast medium (also
known as a barium meal). The medium coats the inner surface
of the stomach and the organ becomes opaque to X-rays. As a
result, a clear image is produced.

Fig. 3.15 Using an artificial
contrast medium to image the
stomach (left) and the blood
vessels in a kidney (right)

artificial contrast medium A Ti#8 RM

### PDF p.99 / printed p.106

Onl lonizing medical imaging

Advantages

X-ray radiographic imaging is very common. It has the
following advantages.

It is relatively inexpensive as compared with other
imaging methods, e.g. CT scan and magnetic resonance
imaging (MRI).

It is simple and fast.

It can provide good resolution of bony structures.

Disadvantages and limitations

However, X-ray radiographic imaging has its own

disadvantages and limitations.

X-rays are ionizing and there is a radiation hazard.
It provides poor contrast of soft tissue structures.
The images of the body structures overlap each other.

Use of artificial contrast medium can be unpleasant.
Some patients may be allergic to iodine compounds
(a common kind of artificial contrast medium).

Snapshot

Intensifying screen

Film has been the most common X-ray detection method for many
years. However, if only a film is used, most X-rays may pass through
without any interaction. To detect X-rays efficiently, a film is sometimes
sandwiched between two intensifying screens.

Each screen consists of a phosphor layer which glows when it interacts
with X-rays. The light emitted then blackens the film. Without the
screen, a patient has to be exposed to X-rays for a longer time to obtain
the same image. Therefore, the use of intensifying screens in effect
reduces the patient’s exposure to excessive X-rays.

Nonetheless, the images are not as sharp as before the intensifying
screens were applied. In imaging the teeth, intensifying screens are not
used since there is a great need for sharper images for diagnosis.

Fig. 3.16 Shoulder dislocation can be easily

observed.

Fig. 3.17 Overlapping of structures

X-rays from

X-ray absorbed er Ay

in the intensifying

screen 3

fewer X-rays
pass straight
through

visble
light

intensifying
screen

double-sided
film

intensifying
screen
direct film

blackening
by X-ray

### PDF p.100 / printed p.107

ik) Snapshot

Fluoroscopy

Fluoroscopy is an imaging method that can
record and display in real time the motion of an
organ in a patient. It is mow commonly
employed in examinations of the stomach and
the large intestine (together with the use of
artificial contrast medium). It is also used in
imaging blood vessels.

Checkpoint @

Shown on the right is
an X-ray image of a
patient's teeth taken
using film.

True or false:

(a) The dental fillings attenuate X-rays more than
the teeth.

(b) The whiter regions suggest that the fillings are
on the side of the teeth closer to the film.

(c) The dark areas imply that most X-rays are
absorbed in these regions before reaching the
film.

X-rays and radiographic imaging

11]

& Swallowing an artificial contrast medium

It is suspected that a patient has broken a bone in
his shoulder.

True or false:

(a) An X-ray image can reveal bone fractures.

(b) Use of artificial contrast medium is essential
for producing a sharp contrast.

(c) Using ultrasound is better as it is non-ionizing.

(d) An X-ray can clearly show if there is internal
bleeding.

Exercise

1.

Which of the following statements about X-rays is 3.

INCORRECT?

A. They are mechanical waves.

B. They are ionizing.

C. They have frequencies higher than visible light.

They can be produced from sudden
deceleration of electrons.

Which of the following materials can attenuate

X-rays the most? 4.

A. Air

B. Bone

C. Soft tissues
D. Water

An X-ray beam has an initial intensity of 400 W cm™*.
It travels in a medium P for a distance of 2 cm.
Suppose P has a linear attenuation coefficient of

0.5 cm”. What is the transmitted intensity?

A. 0.3 «10? W cm?

B. 1.0 = 10? W cm”

C. 15*x10Wem”

D. 2.9*10°Wem™

An X-ray beam travels ina medium Q for 5 cm and
its intensity is reduced to 1/4 of the original. By
what factor is the intensity reduced if the beam
travels in Q for 25 cm?

A. 1/2' B.
ce i D.

1/2°
1/2"°

107 -—

### PDF p.101 / printed p.108

ok lonizing medical imaging

S 5.

After an X-ray beam passes through a metal of 4 cm
thick, the intensity of the beam decreases to 20%.
What is the half-value thickness of the metal?

A. 15cm
B. 1.6cm
Cc. 1.7 cm
D. 18cm

Which of the following statements best describes an
artificial contrast medium?

A. It reduces the intensity of the X-rays reaching
the detector.

It slows down the X-rays reaching the detector.

2)

It amplifies the signal received by the detector.
D. It increases the energy carried by the X-rays
upon reaching the detector.

(a) Define the half-value thickness of a material.

(b) An X-ray beam of initial intensity 40 MW m”
passes through an aluminium filter. What is
the transmitted intensity of the X-ray beam if
the thickness of the filter is
(i) 4.0 mm?

(ii) 5.0mm?
Given that the half-value thickness of
aluminium for the X-rays is 2.0 mm.

A beam of X-rays passes through an aluminium
filter of thickness 5 mm. The linear attenuation
coefficient of aluminium is 32.4 m™ for the X-rays.

(a) What is the ratio of the intensity of the X-rays
leaving the filter to those entering the filter?

(b) Find the half-value thickness of aluminium for
the X-rays.

(a) Radiographic imaging
can be used to diagnose
a bone fracture. Briefly
describe how the
image on the right is
obtained.

(b) Excessive fluid accumulates
in the lung of a patient.
His chest X-ray image

(as viewed from the
front) is shown. In which
side, left or right, of the
patient's lung has the

fluid accumulated?

Briefly explain.

@ 10. A step wedge can be used to show that an X-ray

machine is able to image different tissue
thicknesses. It is usually made of aluminium and it
is shaped like a staircase.

(a) Describe how the following X-ray image of a
step wedge is formed.

(b) An aluminium step wedge has 10 steps, each
the same height. A parallel X-ray beam of an
initial intensity 40 MW m* passes through the
wedge.

(i) Does the intensity of the emergent X-ray
beam vary linearly with the thickness of
each step?

(ii) Suppose the minimum intensity of the
beam that has passed through the wedge
is 10 MW m®. What is the maximum
intensity?

### PDF p.102 / printed p.109

[ee Computed tomographic
scan

One of the limitations of conventional X-ray radiographic
imaging is that it cannot image a cross section of a body. To do
so, we need to produce medical images in another way called
computed tomography (CT).

CT images

CT scanner
A CT scanner is bulkier than a conventional X-ray radiographic  [Saae sien -
imaging machine. Basically, it consists of a big gantry (like a eae ~
huge doughnut) and a table. When a patient receives a CT scan,
he lies on the table and the X-ray tube inside the gantry rotates
around the patient. Opposite to the X-ray tube is an array of
X-ray detectors.
individual
detector
ring of
Fig. 3.18 A patient about to receive a CT scan RNS

SAREE ERROR HEHEHE HEHEHE HEHEHE HEE HEHEHE EEE EEE HEHEHE HEHE HEHEHE HEHE HEHEHE HEHEHE EEE HEHEHE HEHEHE EEE EEE EEE H HEHEHE HHH E HEHEHE EEE EE HEHEHE

computed tomography @% Ria ARI

### PDF p.103 / printed p.110

Onl lonizing medical imaging

How CT images are formed

The X-ray tube emits a fan of X-ray beams
towards the patient at the centre. When the
X-ray beams pass through a slice of the patient's
body, they are attenuated. The detectors on the
opposite side pick up the beams and determine
how much the X-ray beams are attenuated.

The above process repeats while the tube rotates

around the patient’s body once. These beams

are attenuated by different degrees as they Fig. 3.19 The X-ray detector picks up
: ; nee the attenuated X-ray beams.

pass through tissues of different composition

and thickness. Eventually, a series of emergent

intensities at different angles are obtained.

ring of
detectors

With the help of computers, we can transform the intensities
into an array of numbers, each representing the average
attenuation coefficient of a small part of the body slice. These
numbers are then displayed as pixels of different shades of grey
on a screen. An image of the cross section of the body is finally
reconstructed.

200} 200 | 200 | 200 | 200 | 200 | 200 | 200

200 }1000} 1000} 500 |1000/1000/1000) 200

200 1.000}1000} 500 |1000/1000]1000) 200

0°: Io1- Ip,2- Io,3 ees

200 }1:000} 1000} 1000}1000/1000]1000) 200

1°: Wyre by ae ty ae oe r
2°: I ho iP 3 . 200 }1000} 500 | 500 | 500 | 500 11000) 200

200 }1000} 500 }2000/2000} 500 |1000) 200

200 }1.000} 500 | 500 | 500 | 500 |1000) 200

200 | 200 | 200} 200 | 200 | 200 11000) 200

numbers (related to

intensity linear attenuation coefficient)

image

Fig. 3.20 Image reconstruction

The resolution of the image increases with the number of
pixels. One of the limiting factors is the amount of X-ray data
obtained. In general, smaller detectors can increase the amount
of X-ray data obtained and hence the resolution. Nowadays, the

resolution of a CT image can be 1024 x 1024 or above. 4 For an 1024 x 1024 image of size 32 cm
x 32 cm, each pixel covers an area of
(320 mm/1024)’ = 0.1 mm’.

### PDF p.104 / printed p.111

im Enrichment

Analogy to CT image reconstruction

Consider the diagram on the right. Set up 6 linear equations, for example
100 -A-B=60
100 - C- D=40

Can you solve the equations for A, B, C and D?

Similarly, for a CT scan, the attenuation coefficients of different body parts
can be calculated by setting up equations that describe the X-ray
attenuation in various directions. Certainly, the calculation is far more

complicated.

A CT image can show the soft
tissues as well as bones of a
patient. By convention, body parts
that highly attenuate X-rays will
appear white on the image

(Fig. 3.21).

Basically, a CT image can show
the plane of the body sliced by
X-ray beams. With powerful
computers, images from multiple
cross sections can be combined to
form a cross sectional image in the

perpendicular plane (Fig. 3.22).

A CT image is a map of attenuation coefficients of body
tissues. These coefficients can be displayed in a grey or

colour scale by a computer.

another plane.

Computed tomographic scan

i00—4 A
100 —+} C

-—- 60

D —> 40

Fig. 3.22 Multiple CT image slices can be combined to form an image in

### PDF p.105 / printed p.112

oe lonizing medical imaging

i*) Snapshot

Helical CT

In a conventional CT, the X-ray tube rotates around the patient's body once
to obtain the data for a slice of the body. Upon completing the scanning of
one slice, the X-ray tube stops and the table on which the patient lies
moves by a preset distance. The process is repeated until the required
volume of the body has been scanned.

In a helical CT, the patient is moved by the table through the scan beam
continusously as the X-ray tube rotates. This produces one continuous set
of data for the entire body part scanned.

A helical CT can shorten the scan time and produce better images. With
powerful computers, the data from a helical CT scanner can be processed
very quickly to reconstruct images with good resolution in any plane. 3-D
images can also be generated easily.

Back projection

The transformation of the intensities into an array of numbers
actually involves advanced mathematics and is not easy to

understand. Yet, we can visualize the concept with the help of

some graphics.

Consider the body part in Fig. 3.23. When X-rays are directed

at it, they are attenuated by different degrees. If we use shades
of grey from light to dark to represent attenuation from high to

low, a pattern similar to Fig. 3.24 is obtained.

rheetue intensity
Iba Net 4 are
jSOR yy incident
itissue | |
wwe !
ioe htote
ti 1 | | I
bone —— ) rt detected
| 1 | LAs
m.11 1-43 91 J
X-ray detector =o
position

Fig. 3.23 Directing X-rays on a body part

Repeat this process from different angles and we obtain a
series of patterns. When these patterns are overlapped, we

can reconstruct the bones (the two light coloured spots) on the

image. This is an example of back projection.

direction of motion
of the patient

helical X-ray tube
path around the patient

Fig. 3.24 Obtaining a pattern from one angle

PERE HEHEHE HEHEHE EEE EEE EEE E EEE E EEE EEE EEE EEE HEHEHE HEHE HEHEHE EEE HEHEHE E HEHE EEE EEE EEE EEE EEE EEE HHH HEHE RHEE HEHEHE EEEEEEHHEEEE EEE EEE EEE ED

### PDF p.106 / printed p.113

Computed tomographic scan BAX

Fig. 3.25 Simulating a CT scan

In CT, back projection is a method of reconstructing the
image of a body by measuring the data of the attenuated
X-rays from multiple projections.

ACT scan has the following advantages.

¢ Itcan image the cross section of a body. It can also be used
to locate an abnormality inside a body.

¢ It provides good contrast between various body tissues.
Therefore, it can be used to take images of bones, soft-

tissues and blood at the same time.

Fig. 3.26 Internal bleeding discovered by using CT scan

However, a CT scan has some drawbacks.

e Apatient receiving a CT scan absorbs more X-rays than

conventional X-ray radiographic imaging.

¢ Itis more expensive than X-ray radiographic imaging.

### PDF p.107 / printed p.114

Gel lonizing medical imaging

[J] Comparison with X-ray
radiographic imaging

We have learnt about two ways to apply X-rays in medical
imaging: X-ray radiographic imaging and CT imaging. Let us
compare the two.

Image

A CT image is reconstructed from multiple projections (as the
X-ray tube rotates around the patient). In contrast, a radiographic
image only shows a single projection of a human body with
overlapping structures. Therefore, a CT image contains more

detailed structural information.

Fig. 3.27 Structures do not overlap in a CT image (left), in contrast to a radiographic image (right).

Furthermore, a CT image can show soft tissues with
good contrast but a radiographic image cannot.

Exposure to radiation

It takes a longer time to take a CT image than a
radiographic image. Therefore, a patient who
receives a CT scan is exposed to more X-rays.

Fig. 3.28 The cross section of a brain can be shown by
a CT image but not an X-ray radiographic image.

Cost

The cost of taking a CT image is much higher than a
radiographic image as the equipment is more complicated.

4

### PDF p.108 / printed p.115

oo Checkpoint &

1

Computed tomographic scan

A CT image is a map of the

A. attenuation of X-ray beams after they pass
through body tissues.

B. attenuation coefficients of body tissues.

C. reflection coefficients of body tissues.

True or false:

(a) ACT scan does not involve ionizing radiation.

(b) ACT image of a patient is obtained by rotating
an X-ray tube around him.

(c) ACT image can show a cross section of the

human body.

3. Complete the following table by filling in the

appropriate statements given.

A. Structures do not overlap on the image.
B. It is inexpensive.

C. Taking a single image is fast.

D. The patient is exposed to less radiation.

E. Itshows more detailed structural information.

image pros

(a) X-ray
radiographic
image

(b) X-ray CT
image

A patient is suspected of having internal bleeding
in his brain. Which method is the most appropriate
for locating the site of the bleeding?

A. Ultrasound scan

B. Endoscopy

C. X-ray radiographic imaging

X-ray CT scan

A simplified CT scan is performed on a body part
that consists of bones and muscles. Parallel X-rays
are directed on the body from two directions P and
Q and the projections obtained are shown. Which
segment, A, B, C or D is likely to contain a bone?

tyes
te I

Q*>------ tie ta
» Woe

3. The figure shows a CT
image of a patient's head.
(a) What does the contrast
(different levels of grey)
represent?

(b) Briefly explain how
the image is obtained.

4. The following CT image shows a pancreatic cyst.

(a) The cyst appears darker than the surrounding
tissues. Briefly explain why.

(b) The image represents the actual width of
0.5 m. Estimate the diameter of the cyst.

(c) The cyst cANNot be shown on an X-ray

radiographic image. Why not?

Ila 7—

### PDF p.109 / printed p.116

Radionuclide imaging

Waves emitted from the body?

For both ultrasound scan and X-ray imaging, waves are directed
at the interior of a patient's body from the exterior. Have you
ever thought of the reverse?

ultrasound X-ray ee
transducer X-ray tube Jam detector

Fig. 3.29 Can waves be emitted from the organ to produce medical images?

One of the imaging methods is radionuclide imaging (RNI).
Radionuclides are nuclides that emit nuclear radiation. When
they are mixed with suitable chemicals and taken into a patient's
body, they will accumulate at specific organs. We can then
produce images of that organ by detecting the radiation emitted.

Fig. 3.30 A human skeleton (left) and typical radionuclide images for a
bone scan (middle and right)

PEER RRR RRR E HEHEHE HEHEHE EEE EEE EEE HEHEHE HEHEHE HEHE HEHE HEHEHE EEE EEE EEE EEE EEE HEHEHE HEHE HEHEHE HEHEHE EEE EEE EEE HEHEHE EEE ED

### PDF p.110 / printed p.117

[J Suitable radionuclides

What kinds of radionuclides are suitable? We need to consider
various factors.

Kinds of radiation

We have learnt about three types of nuclear radiation: a, 6 and
y. Can you still remember their properties?

In view of the properties of nuclear radiation, we should not
choose a@ sources because a radiation cannot pass through a
human body. Also, a radiation is highly ionizing and it can
readily damage body tissues.

In general, we choose a gamma source for medical diagnosis.
This is because y radiation has the highest penetrating power
and the least ionizing power.

— 939990999 %9993%9I9
@ particle 9900990000 9000 a particle

Radionuclide imaging

B particle ~ ~ * B particle >

y ray “\f\/\>

paper

Fig. 3.31 y radiation has the least ionizing power and the strongest penetrating power
among the three types of nuclear radiation.

Decay process

The half-life of a suitable radionuclide should not be too long;
otherwise it will cause serious health effects. However, its
half-life cannot be too short or a medical diagnosis cannot be
carried out. Also, the radionuclide should decay into a stable
product.

Other factors

In addition, we need to consider many other factors such as
chemical properties, pharmaceutical properties, cost, etc. when
choosing a suitable radionuclide.

aluminium

(5 mm thick)

lead

(25 mm thick)

strength
halved

### PDF p.111 / printed p.118

oe lonizing medical imaging

Technetium-99m

From the above discussion, we should note that there are
many restrictions when choosing radionuclides for medical
imaging. Technetium-99m (Tc-99m) is one of the most common
radionuclides that can fulfil the above criteria.

e It decays by emitting y rays only.

99m 99

e It decays into a stable nuclide (technetium-99).

¢ The gamma rays emitted have suitable energy such that
they can be easily detected.

e Its half-life is 6 hours, not too long or too short.
e Itis non-toxic.

e Itcan be easily attached to various chemicals, forming
suitable tracers for imaging different organs.

e Itcan be easily obtained and is relatively inexpensive.

Apart from Tc-99m, other radionuclides such as gallium-67,
thallium-201, iodine-123 and xenon-133 are also used. However,

Fig. 3.32 A Tc-99m generator

we are not going to discuss each one in detail.

Snapshot

Tc-99m generator

Some radionuclides have to be produced using large
machines such as linear accelerators. In contrast,
Tc-99m can be generated from a portable generator.

Tc-99m can be produced from molybdenum-99 in the
generator:

99 99m *)
a2Mo — 43 Te+ 4

The figure on the right shows the structure of the
generator.

Radionuclides (Mo-99) are adhered to the column of
alumina at the centre. Since they emit B and y
radiations of high energy, a thick lead shielding is
needed to surround the column for radiation safety.

When an evacuated vial is pierced onto the needle at
the top of the generator, the saline solution (contained
in the plastic bag) is forced through the column.

lon exchange occurs in the column and only

technetium-99m is flushed into the vial with the saline
solution. The Tc-99m can then be tagged with suitable
chemical compounds for imaging different organs.

Interestingly, the above flushing process is often called
milking and the generator is called the cow.

vial

lead
shielding

saline~ |

solution

alumina with
adsorbed Mo-99

### PDF p.112 / printed p.119

Effective half-life

When a sample of radionuclides is taken into a patient's body,
its activity drops for two reasons.

The first reason is that the radioactive sample decays. In
Radioactivity and Nuclear Energy, we have already learnt that the
activity decreases by half after one half-life. This half-life is also
called the physical half-life T,,,..

The second reason is that the sample is gradually removed from
the body due to biological processes (e.g. urination). Interestingly,
this is usually a logarithmic process and the time needed to
remove half of the substance in this way is called the biological
half-life T,,,.

Therefore, the actual time for the activity inside the body to be
halved should be shorter than either the physical half-life or the
biological half-life. This duration is called the effective half-life
T;,. and it relates to two other half-lives by:

fo Lng fl
Ts Ei: Tig

activity inside a human body

Note that both radioactive decay and
biological processes are logarithmic. The
activity A inside a human body, after a

radioactive sample is uptaken, will thus

Radionuclide imaging

time

Fig. 3.33 How activity changes with
time due to radioactive decay

4 The reciprocals of the half-lives tell the
probabilities of decay or removal, so
they can be summed up directly.

° P . ° : es radioactive
drop exponentially with time f¢ (Fig. 3.34): es decay
A=A,e™ 0.5A,4-----
where Ay is the initial activity and the } ~
effective decay constant is GBA g stannic pam - a ee
f] | OO an =
In2 1 1 I | Se
=> = . ———- ——_ I ™ = os
k T In2 By " T I effective aan
1/2e 1/2p 1/2b 0 { t _
Fig. 3.34 The activity inside a human body drops due to both radioactive
decay and biological processes.
sedtsissises Cie Te rrr rrrrcon mre asercrerrcce

### PDF p.113 / printed p.120

oe lonizing medical imaging

L Bp Example33 Effective half-life of Tc-99m

A radioactive tracer containing Tc-99m is injected into a human
body. Its physical half-life and biological half-life are 6 hours and

3 hours, respectively.
(a) What is the effective half-life?

(b) By what factor has the activity inside the body decreased after

3 hours?
. SGIMION canon
1 1 1
(a) Applying = +—— we have
1/2e T, 2p Typ
Pr testie
Tyx 6 3
Tye = 2h
In2_ In2

(b) The decay constant is —— = —
1fre 2
Applying A = Aye“, we have

A _ .-(03166)3)

Checkpoint @

1. Are the following true for why Tc-99m is used for
medical imaging?
(a) Itemits y rays only.
(b) It is non-toxic.
(c) Ithasa very long half-life.
(d) It has a long decay series.

2. Various radionuclides have physical half-lives T,,,,
biological half-lives T,,, and effective half-lives T,,.
as shown. Fill in the missing information.

radionuclide

ba a 2x10°d 40d

131 138d 7.6d
al fs 73h 10d

3. Sulphur-35 has a physical half-life of 87.4 days and
a biological half-life of 90 days. What is its effective
half-life?

= 0.3466 h™".

A By the way, the graph of A/A,
against tis a curve, but the graph of
in (A/A,) against t is a straight line
passing through the origin. It has a
negative slope -k because

tae* is Ingea-ket
Using In (a/b) = Ina —Inb, we get
InA =InA, —kt

In other words, k is also equal to the
magnitude of the slope of the graph
of in A against f.

From Q3, find the percentage of activity remaining
in the body 30 days after sulphur-35 is taken into
a human body.

The decay constant is

Applying A = Aye“, we have

True or false:

(a) a sources can be used in medical imaging for
organs near the skin surface.

(b) Ashort biological half-life implies that a
radionuclide decays faster when inside a body.

(c) The effective half-life is longer than either the
physical half-life or the biological half-life.

### PDF p.114 / printed p.121

Radionuclide imaging

>) Imaging process

Next, let us learn how radionuclides are taken into the body and
how images can be produced from the gamma rays emitted.

Radioactive tracer

The first step of the imaging process is to put a radioactive
tracer into a patient's body (by injection, ingestion or
inhalation). Usually, a tracer consists of a radionuclide tagged
with a chemical compound. With the compound, the tracer can
accumulate in a specific organ. A radioactive tracer can also be a

single radionuclide, e.g. iodine-123 and xenon-133 (gas). 4 lodine will accumulate in the thyroid
naturally and therefore can be used

. ° ° . ithout tagging.
After putting the radioactive tracer into the body, we can detect NOB

sey : : lodine-123 is used for imaging
the radiation emitted and produce images. only. For thyroid cancer treatment,
iodine-131 is used instead, because
it also emits B rays (about 90% of the
radiation energy), which have higher
ionizing power to kill cancer cells.

Fig. 3.35 The patient is being
injected with a radioactive tracer.
Note that the medical worker is
protected by lead shielding around
the syringe, and the gloves prevent
any direct contact with the liquid.

Fig. 3.36 Radioactive xenon (a radioactive Fig. 3.37 A Tc-99m generator has to
tracer) is stored in lead containers. be replaced weekly since the parent of
Tc-99m has a half-life of about 2.8 days.

radioactive tracer MATE RHE

### PDF p.115 / printed p.122

Gel lonizing medical imaging

Gamma camera

Film can be used to detect X-rays but it is not effective for

detecting gamma rays. Therefore, to detect gamma rays, we use —4_ because the intensity of the emitted
; is too |

another device called a gamma camera. ca lcs

Fig. 3.38 shows the structure of a gamma camera. It consists of

four main components.

1. The collimator (*#Hif&) is usually a lead plate which has
many holes. Only gamma rays that strike it at a right angle 4 This restricts the gamma rays to entering

the camera perpendicularly so that the

can enter the camera. position of the y source can be located

more accurately.

2. The scintillator (A #8i@) converts incoming gamma rays into
visible light flashes.

3. The photomultiplier tubes O€#fi/#1) convert visible light

flashes into electrical pulses (counts). 0 This is similar to a GM tube which
can convert gamma rays into electrical
4. The positioning logic circuit collects the electrical pulses pulses and be displayed on a scaler as

counts.

and determines the positions in the human body that emit
gamma rays. Dots are drawn on the final image to represent
these positions.

The gamma rays are collected over a period of time, say 30 to
120 seconds, and form an image of the organ being studied.

4 to positioning logic circuit

hon

lead shielding f

amplifier +

electrical pulses

photomultiplier tubes

light guide

light flashes

collimator

patient

Fig. 3.38 Gamma camera

### PDF p.116 / printed p.123

Radionuclide imaging

[3] Radionuclide images

Image and resolution

We know that each gamma ray is converted into a dot on the
screen by a gamma camera. In fact, a radionuclide image is the
accumulation of dots over a certain period of time. The total
number of dots is about 100 000 to 500 000. The more the dots,
the better the image resolution. Fig. 3.39 shows some typical
radionuclide images.

ad o

anterior liver posterior liver
Left kidney Right kidney
right side left side

Posterior
Fig. 3.39 Radionuclide images of kidneys (Left) and liver (right)

As discussed, the injected radioactive tracer will

accumulate in the organs for diagnosis. The darker the a
region on the image, the greater the amount of radioactive > ‘ > >
tracer that has accumulated. . a

A hot spot on the image (dark region) indicates an p
accumulation of tracer that is more intense than normal. In
contrast, a cold spot (light region) indicates the lack of a NN ok ‘Sof

tracer. Both can be due to abnormalities in a body.

For example, in Fig. 3.40, the black dots pointed to by

the arrows are hot spots. These hot spots are due to the
abnormal growth of tissues which causes an intense uptake
of the tracer. Hence, the black dots may be tumours.

Fig. 3.40 Bone scan

SAREE ERE E HEHEHE AHHH EEE HEHEHE EE EEE HEHEHE EEE HEHE EEE HEHEHE HEHEHE EEE EEE HEHEHE HEHEHE EEE HEHEHE EHH HEHEHE HEHEHE EEE EEE E EEE EEEEEES

hot spot #45 = cold spot @%i

### PDF p.117 / printed p.124

3 | lonizing medical imaging

Fig. 3.41 shows another example. A radioactive tracer is injected
into the bloodstream of the patient. As shown in the figure, there "2"
are two cold spots in the lung. The lack of radioactive tracers in R

these two areas of the lungs may be caused by blood clots.

RUL anterior segment

Fig. 3.41 Lung scan (for blood flow)

A series of images can also be taken over a period of time to
illustrate the uptake of the tracer into a particular organ.

Fig. 3.42 shows the kidney scan of a patient. We can see that
the tracer has accumulated in the right kidney but not the left
one. The curve at the bottom shows how the activity (counts
per second) changes with time. The images suggest that the
right kidney may have kidney stones which affect its normal
function.

Renal Perfusion 08/10/2007

‘) #9 *B +h 88

0 | Ss oe

Fr61-64 Duration 120sec Fr65-68 Duraton, 120sec Fr69-72 Duration, 120sec Fr73-76 Duration: 120sac Fr-77-80 Duraton: 170sec
Fr-81-84 Duration: 120sec Fr-85-88 Duraton. 120sec Fr-89-92 Duration. 120sec Fr83-96 Duration: 120sec Fr-$7- 100 Duraton 120sec

Parameters Left Right Total

Split Function (%) 58.2 418 iis

Kidney Counts (epm) 88435 99766 188201 Let Kidney “At Sidney qa

Kidney Depth (cm) 3.799 3.623 z

MAG3 clearance (ml/min) W777 845 202.2

Normalized MAG3 clearance (ml/min) 2174 156.1 373.5 N y)

Time of Max (min) 2.501 10.5

Time of % Max (min) 5.738

Upsiope Time Interval (min) 2501 105 B

Upstope (cps*) 9.998 3.372

(-1%,20%)
Phase 2

Fig. 3.42 Kidney scan

—_!24

### PDF p.118 / printed p.125

Radionuclide imaging EAs

RNI has several advantages:

e Itcan evaluate the function of organs (e.g. lungs and
kidneys, as illustrated on the last page). It can also be used
to monitor the function of an organ following a medical
treatment.

¢ Itcan detect disease early (Fig. 3.43). This is because
pathological changes (ji #222) often occur before structural
damages.

¢ Itcan detect disease efficiently. For example, bone tumours can oy PS
be detected quickly even if their locations are not yet known. a %

a Fig. 3.43 Bone marrow infection
oe (hot spot) can be detected within
1 to 3 days after the onset.
Yet, RNI also has disadvantages.
¢ The images resolution is poor.

e There is a health risk since a radioactive tracer is introduced
into the body.

¢ Itis costly compared with ultrasound and X-ray imaging.

¢ The diagnosis is usually non-specific. For example, a cold spot
on the image of a thyroid may be due to a tumour or a cyst.

Fig. 3.44 The resolution of an RNI image (left) is poor as compared with a CT image
(right) but it can detect diseases effectively.

[3 Comparison with X-ray images

RNI images and X-ray radiographic images apply different
electromagnetic waves (y rays and X-rays). Apart from that,
they differ in various ways.

### PDF p.119 / printed p.126

Onl lonizing medical imaging

Principle

RNI images are produced from the radiation emitted from

a specific organ. In contrast, X-ray images are produced by
projecting X-rays through a body part and detecting how much
of the X-rays are transmitted through.

In addition, a tracer has to be introduced into the patient's body
to produce an RNI image. In contrast, nothing has to be put
into the patient’s body for X-ray imaging (if no artificial contrast
medium is used). Therefore, RNI imaging is invasive but X-ray
imaging is not.

Strengths

The strength of RNI lies in its ability to study the functions of
organs rather than their structures. It can detect diseases early,
before any structural damage occurs. In contrast, X-ray imaging
is very good at showing structural detail but it cannot show
how well the organs are working.

Time

In general, more time is needed to take an RNI image (0.5 to
2 minutes) than an X-ray radiographic image (1 s). For CT scan,
it takes 10 s to 60 s.

Resolution

The resolution of RNI images is poor but that of X-ray
radiographic images is good (Fig. 3.46).

Snapshot

Combining CT and RNI

With modern scanners, we can
combine a CT image and an RNI
image. As a result, diagnostic
accuracy can be greatly enhanced
with both structural and
functional information being

viewed in the fusion image.
RNI Cr

Fig. 3.45 Bone marrow infection
can be discovered from an X-ray
image when there is a structural
change, which can be 2 weeks or
more after the onset.

Fig. 3.46 RNI image (left) and X-ray
image (right) of bones

combined

### PDF p.120 / printed p.127

Checkpoint @

1. The figure below shows the main features of a
gamma camera. Label the three parts and state their
functions.

= to display unit

nea oo!

2. The photo on the right shows
an RNI image of a patient's
thyroid. The thyroid appears
black on the image

Why? \e

True or false:

Radionuclide imaging

A radioactive tracer Must be a radioactive
element.

On an RNI image, hot spots show areas that
may be diseased while cold spots show areas
that are functioning normally.

The resolution of an RNI image is poorer than
an X-ray CT image.

Both RNI and X-ray imaging make use of EM
waves and are therefore non-invasive.

Exercise

1. A patient's thyroid is to be investigated using
radioactive tracers. lodine is being used as it will
accumulate in the thyroid. Which of the following
isotopes is the most suitable to use for

investigation?

isotope decay half-life
A 1-108 a 36 ms
B 1-123 Y 13h
fe 1-125 Y 60d
D 1-131 BY 8d

2. Aradionuclide for imaging of the thyroid has a
physical half-life of x days and a biological half-life
of y days. What is the effective half-life (in days)?

A. x+y B. xy
xy p, <ty
x+y "oxy

3. Which of the following statements about the
collimator in a gamma camera is correct?

A. It reduces the gamma rays that reach the
interior of the gamma camera.

B. It increases the intensities of the EM waves that
reach the interior of the gamma camera.

It converts EM waves of higher energy into
lower energy.

It converts EM waves into electrical pulses.

Which of the following statements about

radionuclide images is correct?

2)

They are formed by exposing a film to gamma
rays.

They are formed due to the attenuation of
gamma rays through the human body.

They have better resolution than X-ray images.

They can be used to study the functions of
certain organs.

In a radionuclide image, the darker the region,

the more gamma rays are attenuated.

the more gamma rays are reflected from the
skin-air boundary.

the higher the concentration of the radioactive
tracer is.

the higher the concentration of abnormal cells

### PDF p.121 / printed p.128

oa lonizing medical imaging

10.

Which of the following statements correctly
describes an advantage of RNI over X-ray imaging?
A. Its image is better in resolution.

B. It does not use any ionizing radiation.

C. It is cheaper.

It can detect diseases earlier.

What is a radionuclide?

A sample of oxygen-15 has an initial activity of
4.0 MBq. It has a half-life of 2 minutes.

(i) How long will it take for the activity to be 11.
reduced to 1.5 MBq?
(ii) The sample is now injected into a human
body. It is found that the time for the activity
of the sample to decrease to 1.5 MBq is less
than that in (i). Briefly explain why.
The physical half-life of iodine-131 is 8.05 days and
its effective half-life is 7.6 days.
(a) Why is the effective half-life shorter than the
physical half-life?
(b) What is the biological half-life of iodine-131?
The function of the lungs can be studied using a
radioactive gas such as krypton-81m (Kr-81m) or
xenon-133 (Xe-133).
(a) Which technique, X-ray imaging or
radionuclide imaging, is suitable for studying
the function of the lungs?
S 12.

(b) The table below shows some facts about the

two gases.
radionuclide | effective half-life | emission
Kr-81m 13s Y
Xe-133 5.3d By

(i) What is meant by effective half-life?

(ii) Suggest one advantage and ONE
disadvantage of using Xe-133 for the study.

A patient has been injected with a radioactive tracer
to study his kidneys. The graph in the next column
shows the count rates measured from the left
kidney and the right kidney against time. Which
kidney is functioning properly? Briefly explain
your answer.

count rate
f left kidney
right kidney
0 time

The photo below shows an RNI image of a pair of

Right kidney

kidneys.

Left kidney

(a) Name the device that takes the above image.

(b) The patient has to lie below the device in (a)
for 120 seconds. Why?

(c) Thirty minutes after the above image is taken,
the patient takes an RNI image again and finds
that far fewer black dots are formed. Give Two
reasons.

The following photo shows two RNI images of

a pair of healthy lungs.
5 5

(a) The patient is injected with a radioactive tracer
before the scan. What is a radioactive tracer?

Briefly describe how a black dot is formed on
the image.

(c) Make a guess: which image is taken from the
front and which is taken from the back? Briefly
explain your answer.

### PDF p.122 / printed p.129

[wa Safety precautions for
ionizing radiation

We should realize that ionizing radiation can be hazardous to
one’s health. How should we measure the potential hazard?

Effective dose

To measure the hazard, we cannot only measure how much
ionizing radiation our bodies absorb. We have to measure the
overall biological effect, which includes three factors:

¢ Absorbed dose received by the body
¢ Type of radiation to which the body has been exposed

e Tissues or organs exposed to radiation

& & radiation (20)

© ss B radiation (1)

V"WWhe y radiation (1)
Wr X-ray (1)

Fig. 3.47 Radiation weighting
factor (higher value implies a
greater impact)

hagus (0.05)
skin (0.01) oesophagus

stomach (0.12)
liver (0.05

colon (0.12)

gonads (0.20)

Fig. 3.48 Tissue weighting
factor (higher value implies
a greator impact)

Effective dose, measured in the unit sievert (Sv), takes all
these factors into account. It measures the overall biological
effects on a person resulting from exposure to ionizing

radiation.
‘ diatio tissue
Effective absorbed ra na on . us
= x weighting * weighting
dose dose
factor factor

Next, we shall discuss how biological effects are related to
the effective dose received by a person.

PATER EERE HERR HHH E HEHEHE AHHH E EEE HEHE EEE EEE EEE HEHE HEHEHE HHH E HEHEHE HEHE THEE HEHE HEHEHE EEE HEHEHE EEE HHH HEHEHE HEHE EEE EEE EES

effective dose HRMB = sievert FIA

tte eee

### PDF p.123 / printed p.130

Gel lonizing medical imaging

|] Biological effects

Biological effects are caused by the damage done to living cells
by ionizing radiation. They can be classified as shown below.

characteristic
of effects

example of effects | occurring time

skin damage

damage to reproductive system

damage to blood forming system acute

damage to digestive system deterministic

damage to central nervous system

cataract

damage to immune system

latent
cancer
stochastic

genetic effects

Table 3.3 Classification of biological effects brought by ionizing radiation

Acute or latent

When a person receives an effective dose of more than 1 Sv,
he may suffer from radiation sickness immediately or shortly
afterwards. Symptoms include nausea, vomiting, extreme
tiredness and hair loss. These effects are called acute effects.

In contrast, some effects may occur 6 months after the dose is

received. They include cancer and genetic effects. These effects
are called latent effects.

Fig. 3.49 Deformed pig born after Chernobyl disaster Fig. 3.50 Radiation burn from X-rays

7s

### PDF p.124 / printed p.131

Safety precautions for ionizing radiation

Deterministic or stochastic

Deterministic effects will not happen unless the received dose

in Enrichment

exceeds a certain value. Also, their severity increases with the ee,

dose received. For example, if the lens of the eye receives an Lethal dose

effective dose of 5 Sv, a cataract will result. Lethal dose (LD50) is
approximately 4 Sv. When a large

In contrast, stochastic effects occur by chance. The higher the group of people receive this

radiation dose received, the larger the chance of having these dose, half will die.

effects. For example, the risk of developing cancer for radiation
workers is 4% per Sv. However, the severity of the effects is
independent of the dose.

Biological effects due to imaging

In general, the typical effective doses that an adult receives

during various ionizing imaging procedures are very small
(Table 3.4) and unlikely to cause any acute effects.

imaging body part taal / Soshlbdcac 4 1 uSv=10° Sv
X-ray skull 100 1/200 000
radiographic chest 20 1/1 000 000
ineges abdomen 700 1/30 000
head 2000 1/10 000
CT scan chest 7000 1/3000
abdomen 8000 1/2500
bone 6300 1/3000
— lung (blood flow) 2000 1/10 000
heart 7800-40 700 < 1/500
kidney 1800-6300 < 1/3000

Table 3.4 Effective dose received during various ionizing imaging procedures (The annual
effective dose received due to background radiation is 2400 Sv.)

In general, a patient receives a greater radiation dose if
¢ a larger part of his body is exposed to radiation, or

¢ he is exposed to radiation for a longer time.

In addition, the effective dose absorbed during RNI may vary
with the radioactive tracers being used.

31 —

### PDF p.125 / printed p.132

oe lonizing medical imaging

Safety precautions

Although the effective dose received during medical imaging
is small, suitable safety precautions should never be neglected.
There are three main principles (JOD) that govern this.

1. Justification of a practice—Justify every radiological
procedure with ‘the benefit against the risk’. There should
always be a net benefit.

2. Optimization of protection—Radiation doses should be
kept As Low As Reasonably Achievable (ALARA). For
example, the radiographer should keep the patient dose to a
minimum as long as the exposure is sufficient to produce a
good diagnostic image.

3. Dose limitation—An individual dose limit should be set as
a safety precaution. The annual dose limit for occupational
radiation workers is 20 mSv.

Minimizing dose uptake

To minimize the radiation dose received by
working staff and patients, procedural checks and
the appropriate application of time, distance and
shielding are essential.

¢ Time—Reducing the time of exposure to
ionizing radiation can reduce the effective dose
proportionally.

¢ Distance—Individuals should keep as far away

as possible from radiation sources. Procedures
and radiation areas should be well designed
(Fig. 3.51).

¢ Shielding— Adequate shielding should be set
up around radiation sources. Dense materials
such as lead and concrete are relatively

effective for attenuating X-rays and y rays
(Fig. 3.52).

Fig. 3.52 The radiographer stands behind a lead glass
window that protects her from receiving an excessive
radiation dose.

### PDF p.126 / printed p.133

Checkpoint @

What is the unit of effective dose?

A. Bq
B. Sv
Cc Wm

Deterministic effects will happen when the order of
magnitude of the effective dose received is greater
than

A. 1 Sv.
B. 1mSv.
C. 1 Sv.

A person receives different effective doses when
exposed to ionizing radiation. The dose received
depends on

A. the radiation type.

B. the organ exposed.
C. the time of exposure.
D. all of the above.

Which of the following statements correctly
describes the difference between deterministic
effects and stochastic effects?

A. Deterministic effects are acute but stochastic
effects are latent.

B. Stochastic effects happen only when the
effective dose received is below 1 Sv.

C. The severity of deterministic effects depends
on the dose received but the severity of
stochastic effects does not.

D. All deterministic effects are fatal.

It is recommended that pregnant women should
avoid receiving any X-ray scans. Briefly explain
why.

Using RNI to perform a bone scan is better than
using CT to locate tumours on the entire body.
Why?

The figure shows a person taking X-ray images
around 1890. From the modern view, state what
safety precautions have been neglected.

Safety precautions for ionizing radiation

True or false:

(a) All biological effects caused by ionizing
radiation are latent.

(b) The biological effects brought by medical
imaging are deterministic.

(c) When receiving RNI, the effective dose
absorbed depends on the effective half-life of
the radionuclide used.

(d) To diagnose a suspected bone fracture, a CT
scan should be used before X-ray radiographic
imaging, if cost is neglected.

Try to explain why a patient receives more effective
dose in the following cases.

(a) Receiving a chest CT scan receives more
effective dose as compared with chest X-ray
imaging

(b) Receiving a chest CT scan receives more
effective dose as compared with a head CT scan

A technician is injecting a
radioactive tracer into a
patient's body. State Two
measures taken that can
minimize the radiation
hazard to the technician.

lonizing radiation has both acute and latent effects

on living organisms.

(a) What is ionizing radiation? Give an example of
ionizing radiation that is used in medical imaging.

(b) Explain, with an example, what acute and
latent effects are.

133 —

### PDF p.127 / printed p.134

Comparison of imaging
methods

Having learnt various imaging methods in this course, let us
summarize them. You should realize that every imaging method
has its own strengths and limitations. When choosing a method,
the doctor should always consider the benefits to the patient.

X-ray radiographic
imaging

ultrasound scan endoscopy | X-ray CT scan |

Qe ry
invasive/non- ; ; , ; ; : : j j ;
: : non-invasive invasive non-invasive non-invasive invasive
invasive
radiation used ultrasound visible light X-rays X-rays y rays
radiation type non-ionizing non-ionizing ionizing ionizing ionizing
radiation iezoelectric . ;
P light bulbs X-ray tube X-ray tube radionuclides

production effect

transmission and | transmission and
reflection of reflection of attenuation of attenuation of

ultrasound waves visible light X-rays from a X-rays from

single direction |multiple directions

principle emission of y rays

typical images

no ionizin ,
parse Sa no'torizié good resolution good contrast
major strength . ae of bony between various | functional study
good resolution radiation ;
structures body tissues

for soft tissues

poor resolution

, ‘ cannot scan can only view the ; : ‘ poor resolution
major disadvantage structures covered! inner surfaces of for soft tissues; relatively large and diagnosis not
and limitation . structures may | dose of radiation iA

by bones or air hollow organs overlap specific
rece dose nil nil small medium medium
time for each image immediate immediate immediate medium long
allow real-time yes (fluoroscopy,
imaging oP aA see p. 107) ii dia
diagnostic & diagnostic & diagnostic & ’ i ? :
uses otal sited surgical diagnostic diagnostic
low medium low medium high

Table 3.5 Comparison of various imaging methods

—-_!34

### PDF p.128 / printed p.135

Summary

eee eee eee eee ee ee eee eee eee eee eee ee eee eee eee eee ee es

¢ X-ray radiographic imaging, computed tomographic
(CT) scan and radionuclide imaging are ionizing
medical imaging methods.

How X-rays travel in a medium

e Attenuation: X-rays lose energy when travelling
through a medium

e Intensity / of an X-ray beam after travelling in a
uniform medium for a distance x

pix

[= Ine =
(Ip: initial intensity; yu: linear attenuation coefficient of

the medium)

¢ Half-value thickness x,, (or HVT): distance travelled
when an X-ray beam reduces its intensity by half ina
medium
In2

X-ray radiographic imaging
e Image formation:
1. X-rays are directed at a patient's body.

2. X-rays are attenuated to different degrees by
different body tissues.

3. X-rays of different intensities emerge from the
body and are captured.

Summary Ws

eee ee ee eee eee eee eee eee eee eee eee ee ee ee ee

e Use of artificial contrast medium:

Make the target organ opaque to X-rays (attenuate
more X-rays) to distinguish it from nearby tissues

soft tissue
artificial
contrast
medium

CT scan

¢ Image a cross section of human body with X-rays
¢ Image formation:

1. Capture a series of data on the target body part
at different projections (by rotating the X-ray
tube)

2. Reconstruct the image by measuring the data of
the attenuated X-rays from multiple projections
(back projection)

3. Produce a map of attenuation coefficients of the
body tissues

incident X-rays body emergent X-rays film

air

RAR AAAAAAAAAAAL

bone

soft tissue

¢ What can be seen in the image:

i. Darker area: X-rays less
attenuated

ii. Brighter area: X-rays more
attenuated

### PDF p.129 / printed p.136

lonizing medical imaging

* What is seen in the image: * Image formation:
e Agrey or colour scale (that displays the 1. Radioactive tracer is brought into and absorbed
attenuation coefficients of the body tissues) by a specific organ in a patient's body.
¢ Resolution higher than radiographic imaging 2. Use a gamma camera to detect the gamma rays.

Form an image to show the distribution of

radioactive tracers in the organ.
¢ What is seen in the image:

i. Hotspot: accumulates tracers more intensely
than normal

ii. Cold spot: accumulates tracers less intensely

than normal

¢ Comparing a CT scan and X-ray radiographic

imaging: see p. 114 Ln
2
Radionuclide imaging ' 4
¢ Imaging method by nuclear radiation (y rays) :
emitted from inside a patient's body R, ‘
¢ Criteria for choosing suitable radionuclides: ‘? >
see p. 117

e Effective half-life T,,.: measures the combined effects
of activity drop due to ¢ Dynamic imaging: a series of images can be taken

F : : over a period of time
i. physical half-life T,,,, (as the sample decays) @ perioe

ii. biological half-life T,, (as the sample is = Illustrate the uptake of tracer by a specific organ
. < <r 1 Sb . oe .

gradually removed from the body due to = Evaluate the function of the organ
biological processes)
1 1 1

Tyme Try Tj

¢ Comparing ionizing imaging methods: see p. 126

activity inside a human body

0.5A9 +----- a
| Dey
1 ~ i
biological ar airs

0254, i a processes~ _ Meiers
1 \ a =
] I Bein ye a
] I z Fire
] I effective

0 t Tt med

iF 21 ume

### PDF p.130 / printed p.137

Safety precautions for ionizing imaging

e Effective dose (unit: sievert, Sv): measures radiation
dose including the biological effect due to ionizing
radiation

¢ Biological effects due to ionizing radiation depend
on the

1. absorbed dose received by the body

2. _ type of radiation to which the body has been
exposed

3. tissues or organs exposed to radiation

¢ Kinds of biological effects
1. occurring time (acute or latent)

2. characteristics (deterministic or stochastic)

Keywords

CERO!

artificial contrast medium A_L#EiW i
attenuation fim

back projection fz fk iid;

biological half-life “£79-# #4

cold spot 7

computed tomography 7 lar i ¥
effective dose {2%

effective half-life 41°} #€ 4

gamma camera {hifi 8 He

Common Mistakes

: Function of artificial contrast medium:

create contrast on target organ
to neighbouring tissues by

emitting more absorbing more
X-rays X-rays

M Artificial contrast medium creates contrast by
attenuating more X-rays through the organ.

Summary Ws

* Principles for safety precautions

1. Justify every radiological procedure with ‘the
benefit against the risk’.

2. Radiation doses should be kept ‘As Low As
Reasonably Achievable’.

3. Establish an individual dose limit.

¢ Minimize dose intake by a suitable
1. time of exposure
2. distance from radiation sources

3. shielding

half-value thickness °F {ii/#

hot spot 244

ionizing radiation AAR}

linear attenuation coefficient 4 UKM
radionuclide imaging HUNTER RMI
radioactive tracer iti AHEM

sievert 4K TF

X-ray X WR

X-ray radiographic image X 2. HCA }4i5% HE Ar

a map of distribution
of radioactive tracer

a map of attenuation
of y rays

M A radionuclide image shows how the radioactive
tracer is distributed. Body tissues virtually do not
attenuate any y rays (due to their high penetrating
power).

### PDF p.131 / printed p.138

of lonizing medical imaging

Chapter Exercise

Multiple-choice Questions

An X-ray beam passes through a material that is

4 cm thick. Suppose its final intensity drops to 1/3 of
its initial value. What is the linear attenuation
coefficient of the material?

0.275 cm!
1.91 cm!

A. 0.119 cm™ B.
Cc. 440 cm! D.

A beam of X-rays travels in a medium. The graph
below shows how the intensity of the beam changes
as it travels through a distance x in the medium. The
initial intensity of the beam is Ip.

Which of the following statements are correct?

(1) The linear attenuation coefficient of the medium
is about 25.5 mm’.

(2) The half-value thickness of the medium is about
2.71 cm,

(3) The intensity of the beam decreases to 1/4 of the
initial value when it travels a distance of 5.43 cm
in the medium.

A. (1) and (2) only B.

C. (2) and (3) only D.

(1) and (3) only
(1), (2) and (3)

Which of the following sketches best represents a

patient having an X-ray image taken with the aid of
an artificial contrast medium?

X-ray ra

film

film i
film the body)

X-ray

87.

Which of the following statements about ultrasound
imaging and X-ray radiographic imaging is/are
correct?

(1) Both images are obtained as maps of attenuation
of the respective waves.

(2) Ultrasound is non-ionizing but X-ray is ionizing.
(3) Both images are good for examining soft tissues.
A. (2) only B. (3) only

C. (1) and (2) only D. (1) and (3) only

Endoscopic imaging and X-ray radiographic imaging
can both be used to examine the colon of a patient.
Which of the following statements about the two
methods is/are correct?

(1) Both require a detector or a probe to be put
inside the body of the patient.

(2) NerrHer can be used to evaluate the function of
the colon.

(3) Nerrner method requires cutting a large hole in
the body.

A. (2) only B.
C. (1) and (2) only D.

(3) only
(2) and (3) only

The biological half-life and physical half-life of a
radionuclide P are 3 days and 4 days, respectively.

P is injected into a patient as a tracer for radionuclide
imaging. How long does it take for the activity of

P inside the patient's body to be reduced to 1/4 of the
original?

A. 2.0 days B.
C. 4.0 days D.

3.4 days
10 days

Lefikidney — Right kidney

Asmall amount of Tc-99m is
injected into Jimmy’s body to
study the function of his kidneys.
The half-life of Tc-99m is about

6 hours.

Which of the following statements
are INCORRECT?
(1) The black dots are due to the emission of 8 and
y radiation.
(2) From this single picture, we can conclude
whether the kidney is functioning properly
or not.
(3) The radioactivity inside the body decreases to
zero after 6 hours.
(1) and (2) only B.
(2) and (3) only D.

(1) and (3) only
(1), (2) and (3)

2)

### PDF p.132 / printed p.139

10.

11.

Which of the following statements correctly
compare(s) acute and latent effects?

(1) Both effects are due to the damage done to
living cells by ionizing radiation.

(2) All acute effects are fatal, but not all latent
effects are fatal.

(3) Latent effects always occur randomly.

A. (1) only B. (2) only

C. (1) and (3) only D. (2) and (3) only

Which of the following statements correctly
compare(s) ultrasound imaging and RNI?

(1) Both use ionizing radiation.

(2) Only ultrasound imaging is suitable for
scanning a foetus.

(3) Only RNI can assess how well the organs function.
A. (2) only B. (3) only
C. (1) and (2) only D. (2) and (3) only

Shown below are three images taken using different
imaging techniques.

Which of the following correctly describes the waves
used?

P Q R
A. X-rays ultrasound y-rays
B, y-rays ultrasound X-rays
C. ultrasound X-rays y-rays
D. ultrasound y-rays X-rays

HKDSE 2012 The figure

shows a thyroid scan using
iodine-131 tracer. The darker

part represents the area with
higher intensity detected by

a gamma camera. Which
deduction about area X is correct?

A. It is something with abnormally high
attenuation of y radiation.

B. It is something with abnormally low attenuation
of y radiation.

2)

It absorbs an excessive amount of iodine.

It cannot absorb iodine normally.

14,

Chapter Exercise es

HKDSE 2012 Which statements best explain why
technetium-99m is suitable for the use of medical
radionuclide imaging ?

(1) Itcan be combined with a wide range of chemicals
and proteins to form radioactive tracers.

(2) Radiation exposure to patients can be kept low
as the half-life of technetium-99m is short.

(3) It emits suitable y radiations that can be
attenuated by different tissues to give a
radiographic image.

A. (1) and (2) only B.

C. (2) and (3) only D.

(1) and (3) only
(1), (2) and (3)

. HKDSE 2013 Technetium-99m is a radioisotope

which undergoes y-decay with a half-life of 6 hours.
Some technetium-99m was combined with a substance
which can be easily absorbed by liver. The compound
was taken by a patient and a series of images were
taken by a gamma camera at different times. Which of
the following statements is/are correct?

‘ahaha

1 hour after intake 3 hours after intake 6 hours after intake

(1) The darker part of the images corresponds to
the part of the liver causing a greater
attenuation of y-rays.

(2) This series of images provides functional
information about the liver of the patient.

(3) The difference between the images is solely due
to the decay of technetium-99m.

A. (1) only
B. (2) only
C. (1) and (3) only
D. (2) and (3) only

HKDSE 2013 The patient of a car accident was
suspected to have internal bleeding in the brain. In
order to locate where the bleeding might have
occurred, which medical imaging method is the most
suitable to be used?

A. Ultrasound scanning

B. Endoscope

C. X-ray radiography

D. Computed tomography (CT)

### PDF p.133 / printed p.140

oa lonizing medical imaging

15.

16.

HKDSE 2014 A patient is going to take a needle

aspiration biopsy in which a fine needle is inserted

into his liver through the skin to take a tiny living
tissue for testing. In order to minimize the risk of

internal bleeding, it is important to locate the large

blood vessels of the liver near the place where the

needle is inserted. Also, as the liver can displace

slightly inside the body, real-time imaging is

therefore needed during needle insertion. The most

suitable imaging method is

A. X-ray planar imaging.
B. computed tomography.
C. ultrasound imaging.

D. radionuclide imaging.

HKDSE 2014 An object is made up of two different
materials P and Q of 1 cm equal thickness as shown.

The linear attenuation coefficients of P and Q for

X-rays are 0.05 cm and 0.68 cm” respectively. An

X-ray beam of intensity [, is incident on the object

and emerges from the object with an intensity I.

Which of the following expressions gives the ratio ne

eam of

0.05 (0.68 — 0.05)’
A. a cicecdie 7

ati (0.68 + 0.05)?
cS Pay D.  @7(0.05+0.68)

Structured Questions

18. The structure of a gamma camera is as shown.

19.

What is the function of a gamma camera in
radionuclide imaging? (1 mark)
Name A, B and C and state their functions.

(6 marks)
Radionuclide imaging involves y rays while
X-ray imaging involves X-rays. Concerning the
position of the source and the principle, state
the differences between obtaining images by
these two methods. (2 marks)
Suggest Two safety precautions for the workers

operating a gamma camera. (2 marks)

Fig. a and Fig. b show two different scans of
thyroids.

Q19a

Q19b

Give one factor that determines the image

resolution in each scan. (2 marks)

svinislainisainticsinaiees statis ea Matas elis eiaior Gta © a alae Ur eeCRareCEeDeRrRLaN jee (b) Briefly describe how these two scans are
performed. (6 marks)
17. Abeam of X-rays travels through a material. The (c) Which scan can tell whether the thyroid is
table below shows how the intensity | of the beam functioning normally? (1 mark)
changes with the thickness x of the material.
0.040 0.080 0.120 0.160 0.200 0.240 0.280 0.320
10.9 9.82 8.89 8.00 7.28 6.60 5.96 5.40
(a) Plota graph of | against x. (3 marks)
(b) Find the half-value thickness of the material
from (a). Hence find the linear attenuation
coefficient of the material. (4 marks)
(c) Apart from the property of the material, suggest

ONE more factor that will affect attenuation.
(1 mark)

### PDF p.134 / printed p.141

& 20. X-rays and gamma rays are two common EM waves

8S 21.

used in medical imaging. Transmission imaging and
emission imaging are the two common imaging
principles.

(a) Give one difference between the two waves.
(1 mark)
(b) (i) Whatis transmission imaging? Give ONE
common example. (2 marks)

(ii) What is emission imaging? Give onE
common example. (2 marks)

(c) Aman is admitted to a hospital after a car
accident. He has a head injury and is suspected
to be suffering internal bleeding inside the
brain.

(i) An X-ray radiographic image of the head
cannot show any abnormalities. Briefly
explain why. (1 mark)

(ii) ACT is performed and the site of internal
bleeding is identified. Briefly describe how

a CT scan is carried out and how a CT

image is reconstructed. (4 marks)

An old woman has had right lower back pain for
more than 2 weeks. She has received X-ray imaging
of the abdomen and a small white opaque area at the
right kidney region is shown on the film. It is
suspected that she is suffering from kidney stones.
She then receives a special examination using a
gamma camera to assess the function of both
kidneys. She lies on an imaging table with the
gamma camera placed behind her back. She is then
injected with a radioactive tracer. Both her kidneys
are imaged continuously over a period of 30 minutes.
Then the images are displayed on the computer
monitor. Regions of interest (ROI) are drawn over
both kidneys and functional curves are generated.
Radioactivity changes within the ROIs are shown by
two curves. Outflow tract obstruction of the right
kidney is diagnosed and the left kidney is
functioning normally.

(a) (i) Suggest one reason why she should receive
an X-ray first before the next method.
(1 mark)
(ii) Explain why the right kidney stone is shown
as a white opaque area on the X-ray film.
(1 mark)

Chapter Exercise es

(b) (i) Can ultrasound imaging detect the kidney
stone? If yes, explain how the stones can be
shown. If not, why not? (3 marks)

(ii) State one advantage and one disadvantage
of using ultrasound to detect kidney stones
as compared with X-ray imaging. (2 marks)

(c) (i) Suggest one common radionuclide suitable
for the radioactive tracer. (1 mark)

(ii) Sketch the functional curves for both kidneys

over the 30 minute period. (2 marks)

- Read the following article about a thallium scan and

answer the questions that follow.

Thallium scan

Thallium-201 (Tl-201) can be used to evaluate
the blood supply to the heart muscle. The scan is
performed together with an exercise stress test.
At the end of the stress test (when the patient
has reached the highest level of exercise he or
she can comfortably achieve), a small amount of
Tl-201 is injected into the patient's bloodstream.
The patient then lies down under a gamma
camera, which takes photographs from the y
radiation emitted by the thallium.

The thallium attaches itself to the red blood cells
and is carried throughout the body. It enters the
heart muscle by way of the coronary arteries and
is taken up by the cells of the heart muscle that
come into contact with the blood.

(a) What is the radionuclide used in the
mentioned test? (1 mark)

(b) Pregnant women are not advised to take a
thallium scan. Suggest ONE reason. (1 mark)

(c) Suggest one possibility if cold spots appear in
the image of a thallium scan. Briefly explain

your answer. (2 marks)

. IB Physics Higher level Nov 2012 This question is

about X-rays.

(a) Define the attenuation coefficient as applied to a
beam of X-rays travelling through a medium.
(2 marks)
(b) Derive the relationship between the attenuation
coefficient js and the half-value thickness x,,.
(2 marks)

14t_ p—

### PDF p.135 / printed p.142

of lonizing medical imaging

(c) Aluminium is often used to filter out the low
energy X-rays in a beam of X-rays. The following
data are available for a particular X-ray beam.

X-ray energy / half-value thickness of
keV aluminium / mm
15 0.70
30 35

Assuming equal initial intensities, determine, after
the X-ray beam has passed through an aluminium
sheet 6.0 mm thick, the following ratio. (3 marks)
intensity of 15 keV X-rays
intensity of 30 keV X-rays

(d) Outline why X-rays are not suitable to image an
(2 marks)

organ such as the liver.

24. IB Physics Higher level Nov 2012 This question is
about the use of radioactive isotopes in medicine.

(a) Distinguish between the biological half-life and

effective half-life of a radioactive isotope.
(2 marks)

(b) The radioactive isotope iodine-131 undergoes
beta decay to the stable isotope xenon-131 with
a physical half-life of 8.0 days. Gamma radiation
is also emitted in this decay. lodine-131 is
readily absorbed by the thyroid gland. The
biological half-life is 21 days.

(i) Calculate the effective half-life of

iodine-131. (2 marks)
(ii) Suggest why iodine-131 is often chosen to
treat cancer of the thyroid gland. —_(3 marks)

[Note: This part is out of the current syllabus.]

(c) Iodine-131 can be used to estimate the total
blood volume of a patient.

Asmall amount of the isotope is dissolved in
8.0 cm’ of a solution. 4.0 cm? of this solution is
injected into the patient. After a few minutes a
5.0 cm* blood sample is taken. The activity of
this sample is measured to be 96 Bq.

The remaining 4.0 cm’ of the solution is mixed
with 1000 cm’ of water. The activity of 5.0 cm®
of this solution is measured to be 510 Bq.

Estimate the total volume of blood in the patient.
(3 marks)

—_!42

25. IB Physics Higher level May 2013 This question is
about the use of X-rays and ultrasound in medical
imaging.

(a) The diagram below shows X-rays being used to
scan a sample of bone and muscle.

X-ray tube

muscle bone

Bie

photographic plate

(i) Outline how the arrangement differentiates

between bone and muscle. (2 marks)

(ii) Use the data below to determine the ratio
L/L, Where |, and I, are the intensity of
X-rays reaching the photographic plate
through the bone and the muscle,
respectively. (3 marks)
Thickness x of sample = 10.0 cm
Linear attenuation coefficient of bone
Ly, = 0.53 cm!

Linear attenuation coefficient of muscle
Lm = 0.30 em™

(iii) The half-value thickness of a material
increases as the energy of the radiation
increases.

Discuss, with reference to penetration and
effect on tissue, why using low energy
X-rays in medical imaging is highly

desirable but is rare in practice. (2 marks)

(b) The same sample is now investigated with an
ultrasound A-scan from the side as shown.

ultrasound transducer

(i) State one advantage of ultrasound over
X-ray imaging. (1 mark)
(ii) State why gel is needed at the transducer—

muscle boundary. (1 mark)

### PDF p.136 / printed p.143

Chapter Exercise es

(iii) Ashort pulse is directed from the (c) (i) Radioisotope B has a physical half-life of
transducer into the sample at time f= 0. 3 months. A hospital has bought 200 g of
The graph shows how the intensity of the active radioisotope B. Assuming none has

reflected signal from the muscle-bone been used, how much active radioisotope B
boundary varies as a function of time. The will be left after 1 year? (2 marks)

speed of sound in muscle is 1.6 x 10° ms. (ii) Radioisotope C has a physical half-life of
6 hours and a biological half-life of 12 hours.

intensity / Calculate the effective half-life of
arbitrary units f\ radioisotope C. (3 marks)
posi Miri iiiiiis pisiit (d) A doctor and a medical physicist are discussing

a ? mS whether or not radioisotope C is suitable for use

time t/10-s
as a tracer.
Calculate the thickness y of the sample of (i) Does radioisotope C have a suitable
muscle. (2 marks) physical half-life for use as a tracer?
Explain your answer. (2 marks)

26. AQA SC08 Jun 2013 Medical physicists consider
the half-life of radioisotopes before recommending
which isotope to use for diagnosis or therapy.

(ii) What type of radiation must radioisotope C
emit if it is suitable to use as a tracer?

Explain your answer. (3 marks)
(a) What does half-life mean? (1 mark) (iii) The medical physicist tells the doctor that
(b) A technician performed an experiment to check radioisotope C has limited use because of
the physical half-life of radioisotope A. Her its organ affinity. What does organ
results, after correcting for background affinity mean? (1 mark)
radiation, are shown in the table below. (Note: This part is out of the current syllabus. ]
time / days | activity / counts per minute (e) (i) The terms below describe some of the types
0 190 of effects radioactivity can have on tissue.
1 140 Explain what each term means: stochastic
2 100 and somatic. (2 marks)
3 75 (Note: This part is out of the current syllabus. ]
4 55 (ii) State rwo factors that can affect the amount
5 40 of damage caused by exposure to
radioactivity. (2 marks)
(i) Plot the results in the above table and draw (iii) State one safety precaution you would take
a line of best fit. (3 marks) to protect yourself if you were working

activity (counts per minute) with radioactive sources in a school
| Seeee soeee ooo laboratory. Explain how this precaution

would protect you. (2 marks)

time (days)

(ii) Use your graph to find an accurate half-life
for radioisotope A. (2 marks)

43 —

### PDF p.137 / printed p.144

onl lonizing medical imaging

HKDSE 2013

27.

(a) The figure below shows how the intensity of an

X-ray beam changes as it travels through a
distance x in two media P and Q respectively.
The initial intensity of the X-ray beam is Ip.

I/ Ip
4
1 Se eee |

0.6
0.4
0.2

0 ~ x/cm

0.5 1.0 y 2.0 2.5

(b) The photo shows an X-ray

(i) What is the half-value thickness of
medium P? (1 mark)
(ii) Find the linear attenuation coefficient of
medium P. (2 marks)
(iii) Does medium Q have a density higher
than, equal to or lower than that of
medium P? (1 mark)

radiographic image of the

chest.

(i) Explain how the image
is formed in terms of

the effects on the
passage of X-rays through different media
including soft tissue and bone. (2 marks)
(ii) Briefly explain why a computed tomography
(CT) image provides more detailed structural
information of the body than an X-ray
radiographic image. (2 marks)
(iii) Although CT images have the advantage
mentioned above, give Two reasons (other
than CT scanners are more expensive) why
conventional X-ray radiographic imaging
has not been completely replaced by CT
imaging. (2 marks)

### PDF p.138 / printed p.145



