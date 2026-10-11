# OCR transcript: Active Physics Book 9 (Medical Physics elective), Chapter 1 — Vision and Hearing

Intake only. Never shown to students and never shipped (the root `.dockerignore` drops `notes/_source/`).

## Front matter

- **Source PDF:** `active-physics/book-9.pdf` (138 pages; image-only scan from Adobe Acrobat Image Conversion, no text layer). Copied read-only into the gitignored `paper2notes/active-physics/`.
- **Pages used:** PDF pp.1–46 = printed pp.4–49. Printed page = PDF page + 3 for this chapter (the chapter opener, printed pp.1–3, is not in the scan).
- **How chapter boundaries were identified:**
  1. PDF p.1 opens with the section banner "1.1 Vision"; running headers read `1 Vision and Hearing` (left pages) and `Vision 1.1` / `Hearing 1.2` (right pages).
  2. PDF p.23 opens with the banner "1.2 Hearing".
  3. PDF pp.38–40 are "Summary" (Key Ideas, Keywords, Common Mistakes); PDF pp.41–46 are "Chapter Exercise".
  4. PDF p.47 opens "2.1 Medical imaging" with running header `2 Non-ionizing Medical Imaging`, so Chapter 2 starts there.
- **OCR method:** `pdftoppm -r 200 -png` per page, then Tesseract 5.5.3 `-l eng` (default page segmentation). Prose reads well; equations, Greek letters, superscripts and figure labels are often garbled. Formulae in `outline.md` were checked against the page images, not the raw OCR.
- **QB bank:** `QB_E401` (67 items: 40 MC, 15 SQ, 12 LQ; ids `PHY1901…`) is the publisher bank for this chapter; staged at `paper2db/qb-web-ui-staging/qb/items/QB_E401.json`. Not deployed to `/qb` (only `QB_501`–`QB_503` are deployed).
- **DSE classification:** none. `paper2db` classifies Paper 1 (compulsory part) only; this elective is examined in Paper 2, which the repo does not hold.
- **Conventions:** raw OCR below is lightly cleaned (lines with no letters or digits dropped). Treat garbled maths as untrustworthy.

## Transcript (raw OCR per page)

### PDF p.1 / printed p.4

sae Vision

In this book, we are going to study how medical images can be
produced using different waves. But for now, let us learn how
images are formed in our eyes first.

Our eyes

An eye can be considered as an optical refracting system that
consists of a convex lens and a screen. A real image is formed
on the screen so that we can see. With a human eye, only visible
light (whose wavelength is between 400 nm and 750 nm) can be
detected.

Basic structure

Fig. 1.1 shows a cross section of a human eye. Light entering
the eye is first refracted by the cornea. Next, it passes through
the pupil and is then refracted by the lens. Finally, it falls on the
retina and a signal is sent to the brain via the optic nerves.

pupil

cornea

optic

“aqueous
nerve

humour

“vitreous (* two types of fluid)
humour

muscle

Fig. 1.1 Cross section of a human eye An ox's eye
(S32 V91-e11)

PERRO RRRREEEEEEEEE HEHEHE EEE E HEHEHE HEHEHE HEHE EEE EHHHHHHHHAEEEEEE EEE EEE EEE EEE HEHEHE HEHEHE EEE EE HEHEHE EEE EEE EEE EEE E HEHEHE HEED

cornea MB pupil MHL ~~ lens AnKM® =—srretina HAM — optic nerve HP

### PDF p.2 / printed p.5

Refraction system

Fig. 1.2 shows the refractive index of various components in
an eye and how an image is formed on the retina. From the

refractive indices, we see that the cornea does most of the eye’s 0 This can be explained by the greatest
difference in the refractive indices

focusing while the lens is used only for fine tuning. diver aha corneas enitilvereie

The light rays are refracted at
the cornea and at the lens.

object

: ' aqueous ! vitreous!
medium air cornea I ' lens !

' I humour \ humour 1

I l 1 |

refractive index 1.00 | 1.38 1.34 ! 1.40 134!

Fig. 1.2 Image formation on the retina

Consider light coming from a point on an object. When the light
enters an eye, a real, inverted and diminished image is formed
on the retina. The ciliary muscle may contract or relax to change

the shape of the lens so that a sharp image can be caught. 4) We shall discuss how a sharp image can
be caught by the retina for objects at
various distances on p. 10.

im Enrichment

Iris and pupil

There is a group of thin layers of circular
pigmented tissues in front of the lens called
iris (XLA@). It consists of muscles that can
change the size of the pupil, the aperture in
the middle of the iris.

The iris controls the amount of light that
falls on the retina by adjusting the pupil size.
The pupil constricts in a bright environment
and dilates in a dark environment. Its typical
size is between 2 mm and 7.5 mm.

### PDF p.3 / printed p.6

oui Vision and Hearing

Light sensitive cells

In junior science, we have already learnt that there are two kinds
of light sensitive cells in the retina, namely rods and cones.

e The rods are very sensitive to different intensities of light
and are mainly responsible for vision in a dark environment.

¢ The cones are responsible for vision in bright conditions. The cones are less numerous than the
rods (Fig. 1.3) and distributed unevenly,
most concentrated at the yellow spot
(Fig. 1.4).

They are used for the perception of colours.

rods

vitreous retina
humour

Fig. 1.3 Rods (pale yellow) and cones (yellow) in the retina

Both rods and cones can convert light into electrical signals
(nerve impulses), which are then sent to the brain via the optic
nerves. The brain interprets the signals and produces vision.

The point where the optic nerves leave the retina has no light
sensitive cells. Light falling on this point cannot be detected
and hence it is called the blind spot. In contrast, cones are most
concentrated at the yellow spot and this point is very sensitive
to light.

Fig. 1.4 Blind spot and yellow spot

YW Try this

Blind spot

1. Look at the picture on the right. Hold the book
about 15 cm from your eyes.

2. Close your left eye.

3. While staring at the hat with your right eye,
slowly move the book away from you. At a
certain position, you cannot see the rabbit.

Can you explain why?

PRR RRRRREEREEEHHH EEE HEHE HEHEHE EEE EEE EEE EEE HEHEHE HEHEHE HEHE HEHE EHHHHHHHTEHEEEE EEE EEE EEE EE EEEE HEHEHE HEHE HEHEHE HAE HEHEHE EEE EEE EEE EEE E HEHEHE HEED

rod #H# = =©6cone # = blindspot #&i_—Ss yellow spot HH

### PDF p.4 / printed p.7

_ Checkpoint @

1.

3. At which of the following is light refracted
the most?

Label the cornea, lens,
retina and optic nerve
in the diagram.

A. Air-cornea boundary
B. Between the cornea and the lens
C. Inthe lens

4, ‘True or false:

(a) The shape of the cornea changes when an eye

Circle the appropriate properties. The image ;
focuses on an object.

formed on the retina is
(b) When an eye focuses on an object, an image is

(a) virtual / real ;
formed between the lens and the retina.

(b) erect / inverted

(c) diminished / magnified / the same size as the
object

(c) There are two kinds of light sensitive cells in
the retina.

(d) The light sensitive cells can guide the light
falling on them to the brain.

im Enrichment

Persistence of vision

Light sensitive cells produce signals when light falls on them. It takes some
time for a signal to decay. The time ranges from 0.02 s for bright light and
0.2 s for dim light. As a result, the vision of a static image can persist for

a short time.

Films or televisions actually produce a series of still pictures instead of
continuous motion. It is our persistence of vision that creates the illusion
of smooth rather than jerky movements.

Y Try this

Stereogram

Our brain can interpret the colours
and the brightness of an object.
Also, it can combine two slightly
different views from our
horizontally separated eyes. A
stereogram is a 2D picture that lets
a user ‘see’ a 3D object. Shown on
the right is a kind of stereogram
that works by free viewing.

Can you see a horse?

### PDF p.5 / printed p.8

oi Vision and Hearing

|) How we see

In the previous subsection, we have discussed the structure of
the eye and the functions of its main parts. Now, let us study the
physics behind our vision.

Power of a lens

In Ray Optics, we have learnt how lenses work. A thicker lens
usually has a shorter focal length f, thus we can say that a
thicker lens is more powerful in bending light.

Fig. 1.5 Two convex lenses of different focal lengths

The power of a lens P is defined as the reciprocal of the focal
length f (in metres). The more powerful the lens, the shorter its
focal length and the larger degree to which it bends light rays.

The unit of power is the dioptre (D) and 1 D = 1 m''. By ‘real
is positive’ convention, the power of the lens is positive if it is
convex and negative if it is concave.

PERE RRR RRR H EEE E EEE E EEE H HEHE EEE EEE HEHE EEE HEHEHE HEHEHE HEHEHE EH EHTE HEHEHE EEE HEHEHE EEE EEE EEE HEHEHE HEHE EHH HEEEEEEEEEEHHEEE EEE EEE HEHE EEE

power (of a lens) ##4893& dioptre EXE

### PDF p.6 / printed p.9

A compound optical system may have 4D
more than one lens. If the lenses are
thin and close together, the power

of the combination is the sum of the

individual power. For example, a thin ey,
lens of power +4 D and a thin lens ‘
of power —2 D can combine to give a “
total power of +2 D (Fig. 1.6).
W+2D

Fig. 1.6 The effective total power of two thin lenses
placed close together

Lens formula and the eye

Next, let us review how an image is formed by a convex lens.
Suppose a convex lens has a power of P and a focal length of f.
When an object is placed at a distance u (where u > f) from the
lens, a real image will be formed at a distance v behind. The
quantities are related by

rile
glr

We can use a simplified eye model to fit the above formula.
Treat the cornea and the lens as a single lens of power P.
The image distance v will be about the size of the eyeball.

object A

- ~ mee
object am k “ty
—— om t as

Fig. 1.7 How a convex lens and an eye form images

### PDF p.7 / printed p.10

“ori Vision and Hearing

Accommodation

In a convex lens experiment, once we change the object
distance, we need to move the screen to a different position
in order to catch the image. Nevertheless, our eyeball is
more or less fixed in shape. How can we catch images on
our retina for objects at different distances from us?

. . Fig. 1.8 Catching an image formed by a convex
Actually, our eye changes the shape of its lens in order to lens with a screen

focus on an object (i.e. produces a sharp image) and this

process is called accommodation. When viewing near ¢ ; Puzzle ee

objects, the ciliary muscle contracts and the lens becomes Vision in Water

thicker. In contrast, the ciliary muscle relaxes and the lens A swimmer cannot see clearly

becomes thinner when viewing distant objects (Fig. 1.10). under water without goggles or a
mask. Why?

ciliary muscle thickened

contracts

lens

ciliary muscle light from
relaxes near object
thin isnt focused on
lens the retina
lens is thick ; .
initially light from ;
distant object »
lens pulled flat - (>
and becomes thin >
Fig. 1.9 How the shape of the lens is changed by Fig. 1.10 Accommodation

the ciliary muscle

However, there are limits to how much the shape of the lens can
be changed. In other words, there is a range in which an object
can be seen clearly. The closest position at which an object can
be focused is called the near point while the farthest position is
called the far point. The near point of a normal person is 25 cm
away and the far point is infinity.

Snapshot

Vision in fishes

Unlike a human, a fish moves its lens closer to or
farther from the retina to focus on an object.

PEER RRR HEHE HEHEHE HEHEHE EEE EEE HEHEHE EEE EE EEE EEE HEHEHE HEHEHE HEHEHE EEE EHHEHTE HEHEHE EEE HEHEHE EEE EEE HEHEHE HEHEHE HEHEHE EEEEEEEEEEEHEEE EEE EEE EEE HEHE ED

accommodation # #4  nearpoint#t#i far point Mi

### PDF p.8 / printed p.11

im Enrichment

Depth of field

Consider the diagram as shown. When
an object is placed at O,, a sharp image
is formed on the image plane. When the
object is placed at O, or O;, the image
formed on the original plane becomes
blurred but is still tolerable (i.e. within
the acceptable blur spot). The depth of
field (RR) is actually the maximum

distance between O, and O; such that on of
the image formed on the plane can still
be regarded as sharp.
objectat O, O; O;

The depth of field is affected by various
factors. In general, the smaller the
diameter of the lens or the farther away
the object, the deeper the depth of field.

WES Example 1.1 Y Total power of an eye

The cornea is like a fixed convex lens with a power of about 41 D.
When the eye of a young person is viewing the infinity, the power
of the lens is 18 D.

the plane

Conceptual

light from he Jes

@ point object

(a) Find the total power and the equivalent focal length of the eye.

(b) The eye now focuses on its near point. Does the power of the
lens increase or decrease? Briefly explain why.

(a) The total power is 41 + 18 = 59 D.
The equivalent focal length is 1/59 =~ 0.0169 m.

(b) The power of the lens in the eye increases.

Since the image distance remains the same, by P = 1 a 1 ,
the lens in the eye should become more powerful as
1/u increases. A, Initially, u > 0 and 1/u > 0.

### PDF p.9 / printed p.12

ori Vision and Hearing
L mp Example 1.2 Near point and far point

Alan’s near point is 25 cm away from him and his far point is
infinity. He is now viewing an object placed at his near point and
the power of his eye is 70 D.

(a) Find the image distance.

(b) Hence, or otherwise, estimate the change in the power of
Alan’s eye when he views an object placed at his far point.

This change is also called the power of accommodation. > See the Enrichment on p. 21.

PLN POE) bccnryriuersa pines ite arsenate re soa as parame ogee:

(a) Applying P = + ., we have

1 1

70 =—— +=
0 025 +o
v = 0.01515 m

The image distance is 0.0152 m or 1.52 cm.

(b) The power of the eye becomes
: 1

= +—— = 66D
uv a 0.01515

The change in power is 66 - 70 = -4 D.

os Checkpoint @

1. What is the power of a lens of focal length 2 m if it is accommodate to her friend. Your answer should
(a) convex? mention the action of the ciliary muscle and the

(b) concave? shape of the lens.

2. Asystem consists of two thin convex lenses closely
placed together. If their focal lengths are 2 cm and
5 cm, what is the total power of the system?

3. (a) Write the definition of near point and far point.

(b) Where is the far point of a normal person?

5. Cathy is looking at a clock which is about 0.8 m
from her. Suppose her eyeball is 1.6 cm in diameter.
Estimate the power of her eye.

4. Amy is reading messages on her phone. At a certain
point, she raises her head and sees her friend
coming from afar. Briefly describe how her eyes can

### PDF p.10 / printed p.13

Resolving power

Our eyes can focus on an object when it is between the near
point and the far point. However, we may not see all of its
details. For example, the two headlights on a car may appear
as one light spot if the car is very far away. In other words, our
eyes cannot resolve two objects when their angular separation
is too small.

(Dee GaDye-z: °

(a) The headlights cannot be resolved. (b) The headlights can be resolved.

Fig. 1.11 Our eyes cannot resolve two objects when their angular separation @ is too small.

How much detail we can see depends on how acute our
vision is or how high the resolving power of our eyes is. This
is affected by various factors such as the density of cones in
the retina. In physics, there is a theoretical upper limit on the
resolving power posed by diffraction (Fig. 1.12).

screen

screen screen

circular circular

circular
aperture aperture aperture
object object 1 object 2 object 1 object 2
Fig. 1.12 Diffraction occurs (a) Without diffraction (b) With diffraction
when light passes a circular Fig. 1.13 Light emitted from two objects that are close

aperture. together passes through an aperture.
Consider Fig. 1.13. Two tiny objects emit light and the light
passes through a circular aperture. Without diffraction, the light
will produce two distinct spots on the screen. However, due to
diffraction, a single blurry spot may be produced if the angular
separation of the two objects is too small.

resolving power 23RD

### PDF p.11 / printed p.14

ori Vision and Hearing

Draw an analogy between the above set-up and our eye. The pupil
is the circular aperture and the retina is the screen. For our eye to
resolve two objects, their minimum angular separation has to be

wy 1:22A (5 radians)

Ee D

where A is the wavelength of the light, and
D is the diameter of the pupil.

Eyesight test

1. Ask your partner to hold this page of his book upright.
2. Stand about 20 m from the page and look at the above letters.

3. Walk towards the page slowly until you can just tell the direction at
which the letters are pointing. The distance you walk reflects the
resolving power of your eyes. (Note: A person with normal vision
should be able to resolve the letters at a distance of 6 m.)

Snapshot

Digital colour display

If we magnify a white cloud on an LCD TV, we shall see a grid of tiny red,
blue and green light spots. If none of them emits white light, why does the
cloud appear white?

These light spots are so closely packed that our eyes cannot distinguish
them at all. As a result, the image we perceive is the combination of red,
blue and green light spots, and our brain would interpret such an image as
a white light spot.

4 The value of @.,,, is sometimes called
the resolving power or the angular
resolution.

Ay 180° = mrad

Bk ig0 "34

### PDF p.12 / printed p.15

A Solution

LK mp Example 1.3 Resolving power of an eye

In a bright environment, the pupil of an eye has a diameter of

3.5 mm. Take the wavelength of light to be 500 nm.

(a) Estimate the resolving power of the eye.

(b) The pattern below is made up of alternate black and white
strips, each 2 mm wide. Using your answer in (a), estimate at
most how far away the eye can be from the pattern such that

it can still barely distinguish successive white strips.

(a) The resolving power of the eye is

6

eee eee eee eee ee ee eee eee eee eee eee ee eee eee eee)

_ 1.224 _ 1.22 x (600 x 10°)

— dl 3.5x 10°
=().000 174 3
= 0.000 174 rad

(b) Let r be the viewing distance.

For small 0, we have f = r@. Thus
0.002 = 0.000 174 3r
r=11.5m

%@ Watch-out

How clearly can you see?

From the formula about resolving power, it seems that
we can see better in the dark as the pupil becomes
wider. However, acute vision depends on many factors
besides the pupil size. It also depends on the lens, the
retina, the brain, etc.

For example, an ideal lens can converge light rays from
a point object to the same point. However, this is not
true for a practical lens due to various factors called
aberrations. The effects of certain aberrations (e.g.
caused by uneven curvature of the cornea) can be
reduced by a smaller pupil.

Therefore, two competing factors are affecting our
vision when a pupil becomes smaller in bright light. By

Cee eee

conventional wisdom, we know that we can see better

in bright light. This suggests that reduction of

aberrations
overcomes the
resolution factor due
to diffraction in this
case, (However, the
physical limit of 6,,,,,
is absolute, Our eye
can only resolve two
objects that have an
angular separation
larger than 6,,,...)

min*

### PDF p.13 / printed p.16

Vision and Hearing

Spectral response

Having learnt how images can be formed on the retina, we are
about to see how our brain perceives an image.

When light falls on the retina, it is absorbed by the light
sensitive cells, namely the rods and the cones. Our eyes have
one type of rod but three types of cones.

Fig. 1.14 shows the spectral response of our eyes, i.e. how
sensitive the three types of cones and the rods are to the visible
spectrum. The sensitivities of cones and rods vary considerably
with wavelength and are shown by the receptor absorption
curves.

relative sensitivity

4
1.0

all cones

0.8 5

0.6 -

0.4- ‘green’ cones

02- ‘red’ cones

T T T T T T
400 450 500 550 600 650 700 750 wavelength / nm

Fig. 1.14 Receptor absorption curves

The three types of cones are most sensitive to red, green and
blue lights. Each type responds to a range of wavelengths rather
than a single wavelength.

However, the three types of cones are not equally sensitive to
different wavelengths of light. For light of the same intensity,
a human eye is most sensitive to green light. Therefore, green
light appears brighter than other coloured lights.

Fig. 1.15 Human eyes are most sensitive
to green lights.

PEER HEHEHE EEE EEEE HEHE EEE EEE EEE HEHEHE HEHEHE HEHE HEHE HHHHHHHHTEEEEEEEE HEHEHE EE EEE EEE HEHEHE HEHEHE HEHEHE AE HEHEHE EEE EEE EE EE HEHEHE HEHEHE

spectral response 18M receptor absorption curve M3 geWR Uy dh

### PDF p.14 / printed p.17

Different wavelengths of light cause different stimulations to

the three types of cones. This enables us to distinguish between

lights of different wavelengths (or colours) (Fig. 1.16).

0.

0

0.

0.

4 felative sensitivity

400 450 500 5

84 0.8 4

6-5 0.6 4
4- 0.4 4
25 0.2 4
0 t T T T T ro

50 600 650 700 750

wavelength / nm

4 relative sensitivity

400 450 500 550 6

1

00 65

0 700 750

wavelength / am

Fig. 1.16 Lights of wavelengths 500 nm and 600 nm stimulate the cones differently.

Also, we can stimulate the three types of cones by a combination

of three coloured lights with different intensities to give the

perception of all visible colours.

By contrast, rods are most sensitive to light at 510 nm

(blue-green) and least sensitive in the red zone. In a dimly lit

environment where only rods but no cones are used, we cannot

perceive any colours but only shades of grey.

Fig. 1.18 summarizes how we can see things.

Fig. 1.17 The mountains and grasslands
lack colour under moonlight.

; The brain sends
Light is Light An image of Seales tas Utero signals to change
: ane convert light into interprets the
een aoe feat os maar send them to the and produces Res
ee meee erenne. brain via optic nerves. vision. bgt gains
object if necessary.
Fig. 1.18 How we see
Checkpoint €
1. State the rwo factors that affect the resolving power 3. According to Fig. 1.14 on p. 16,
of an eye due to the diffraction limit. (a) which type of cones will be stimulated by light
of wavelength 500 nm?
2. What would your answer be to (b) in Example 1.3 (b) which type of cones will give the greatest

on p. 15 if the pattern is made up of alternate black

and white strips, each 3 mm wide instead?

response to light of wavelength 500 nm?

### PDF p.15 / printed p.18

ori Vision and Hearing

Defects of vision and corrections

A normal person can focus on an object that is 25 cm or farther
from his eye. However, if he suffers from defects in his vision,
he may not see a near object, a distant object or either clearly.

In general, defects of vision are caused by eyes that are too
powerful or too weak. Sometimes, they can be caused by
eyeballs that are too short or too long.

Now, let us carry out an experiment to learn more about defects
that cause problems in seeing clearly.

IO Experiment 1.1 Model eye

1. Set up the model eye as shown in Fig. a. Purpose: To study normal vision and
defects of vision by using a model.

2. Direct a parallel light beam to the ‘normal eye’ (Fig. b), the
‘short-sighted’ eye (Fig. c) and the ‘long-sighted’ eye (Fig. d),
respectively. Note the focusing of each eye.

$2[—) Model eye
pens) (SP \V9)-e12)

3. Find the suitable corrective lens for the short-sighted eye and
the long-sighted eye.

Fig. a Fig. b

Fig. d

De OI aie na cea

1. Where has the light beam been focused for the three ‘eyes’?

2. What kind of lens is suitable for correcting short sight and long
sight?

### PDF p.16 / printed p.19

Short sight

Short sight is the most common defect of vision. A short-sighted
person can only see a near object clearly. For a distant object,

its image is formed in front of the retina and therefore appears
blurry.

Fig. 1.19 Photos simulating what a
short-sighted person sees when the
object is near (left) and when the object
is far away (right)

There are two possible causes:
¢ The eye is too powerful.
¢ The eyeball is too long.

To correct short sight, we need to reduce the power of the eye.
A concave lens (a lens with a negative power) is thus needed.

before
correction ”
uncorrected
far point
apenas Ad
after concave lens
correction
lett ® The virtual image of an object at infinity
— — formed by the corrective lens should be
rere far point \ located at the uncorrected far point of
mnnni
Greeirreenas the eye. See Example 1.4 on p. 22.
far point

<4 At the same time, a concave lens makes

the near point a little bit farther away.
corrected near point

uncorrected
near point

Fig. 1.20 Short sight and its correction (not to scale)

PAAR EERE EERE RHEE E HEHEHE HEHEHE HEHEHE EEE EEE HEHEHE HEHEHE HEHEHE EEE H HHH E HEHEHE EEE EEE HEHEHE HEHEHE EE EEE EEE EEE EEE HH HEHEHE HEHEHE EEE E HEHEHE HEHEHE

short sight #£#%

### PDF p.17 / printed p.20

Vision and Hearing

Long sight

A person with long sight
can only see a distant
object clearly, in contrast
to a person with short
sight. For a near object, its
image is formed behind
the retina and therefore

appears blurry. Fig. 1.21 Photos simulating what a long-sighted person sees when the object is near (left)
and when the object is far away (right)

There are two possible causes:
¢ The eye is too weak (not powerful enough).
¢ The eyeball is too short.

To correct long sight, we need to increase the power of the eye.
A convex lens (a lens with a positive power) is thus needed.

before after convex lens
correction correction
1 eh =a 3 -7 ">

normal uncorrected

NESE POE near point corrected

(25 cm) near point

(25 cm)
—— The virtual image of an object at the
ee corrected near point formed by the

uncorrected corrective lens should be located at the
near point

uncorrected near point of the eye. See
Example 1.5 on p. 23.

Fig. 1.22 Long sight and its correction

Snapshot

Ortho-K and Lasik

Apart from wearing glasses, it is also possible to remedy short sight by
changing the curvature of the cornea. At present, there are two popular
treatments, namely Ortho-K and Lasik.

5 6
With Ortho-K, a patient needs to wear contact lenses to sleep every night S
to gradually flatten the cornea. The treatment takes about 4 to 6 months.

With Lasik, part of the cornea is vaporized by a laser during surgery which
lasts for only one minute. The patient needs to take special care for at least
one month.

& Ina Lasik operation, the outer layer of
the cornea is cut open and a flap is
pulled open. The laser is then used to
reshape the middle layer of the cornea.

PEER RRR RHEE HEHEHE HEHEHE EEE EEE EE HEHEHE EEE HEHEHE EEE H HEHEHE HEHE HEHEHE EE HEHEHE HEHEHE EEE HEHEHE HEHEHE HEHEHE EHH HEHEEEEEEEEHHEEE EEE EEE HEHE EEE

long sight #872

### PDF p.18 / printed p.21

Old sight

When a person gets older, the lenses in the eyes lose elasticity.
The lenses may not be able to change their shapes well enough
to accommodate to the object. As a result, the person suffers
from old sight.

For a person with both old sight and short sight, she needs to
increase the power of her eyes when she views a near object.
Therefore, convex lenses are needed (to correct old sight). In
contrast, she needs concave lenses to reduce the power of her
eyes when she views a distant object (to correct short sight).

A pair of glasses with bifocal lenses allow the person to avoid
going to the trouble of having to change her glasses frequently.

concave part for viewing
distant objects

convex part for viewing
near objects

Fig. 1.23 Wearing a pair of bifocal glasses

im Enrichment

Astigmatism

Astigmatism (#3) is a common defect whereby the sufferer can see clearly in
one plane (e.g. 12-6) but not in the others. The defect is caused by an irregular
curvature of cornea or lens such that the light coming from an object may focus
at different parts in the eye. As a result, the sufferer sees a blurry image.

To correct astigmatism, the lens is specially shaped 12
to compensate for the irregular curvature of the
cornea or the lens. Nowadays, the condition can

also be corrected using surgery like Lasik. ~ ZB

<4 In effect, you may think of old sight as
age-related long sight.

<4) Another popular option is the
progressive lens, which has a smooth
transition from the upper part to the

lower part.

im Enrichment

Power of accommodation

The table below shows how the
power of accommodation changes
on average with age. The power
declines with age as the lens loses
its elasticity. As a result, a person

will suffer from old sight.

age | power of accommodation

12 eh.
20 11.5
30 8.9
40 a)
50 2.0
60 1

SAREE EERE EEE EEE EHH E HEHEHE HHH HEHE HEHEHE EEE EEE EEE EEE HEHE HEHEHE HEHEHE HEHEHE EEE EEE HEHEHE HEHEHE EEE HEHEHE HHH HEHEHE HEHEHE EEE HEHEHE HEHE EHS

old sight #7

### PDF p.19 / printed p.22

oi Vision and Hearing

Snapshot

Defects of vision

In Hong Kong, about 90% of the population suffers from short sight and
this is the most common defect of vision. In addition, there is a tendency
that the number of children suffering from short sight is increasing: 30% for
age 7, 53% for age 10 and 85% for age from 13 to 15.

Actually, the percentage of the population suffering from short sight in
Hong Kong is very high compared with that of Europe and US which is
about 20 to 30%. The reason is not clear but it can be due to various
factors, including ethnicity, living environment and habits.

Li mee Example 1.4 Correction of short sight

John has a short-sighted eye with a far point 4 m away from him.
(a) What kind of lens should be used to correct the defect?

(b) Calculate the power of the lens needed to correct the defect.
Neglect the distance between the corrective lens and the eye.

(c) How does the near point change when he uses the corrective
lens in (b)? What is his new range of vision? The uncorrected
near point is 20 cm from the eye.

OUION ican assasiamnseaws

(a) Aconcave lens should be used.

(b) The focal length of the corrective lens should be 4 m, which is
the far point of the defective eye.

uncorrected
far “x 7
> 1.

Hence, f= —4 m.
The power of the corrective lens is 1/(—4) = -0.25 D.

(c) Consider an object placed at a distance u from the eye. For
the eye to see the object clearly through the corrective lens,
the image formed by the lens cannot be nearer than the
uncorrected near point of the eye, i.e. 20 cm or 0.2 m.

Given: f=-4 m (negative for a concave lens)

v =-0.2 m (negative for a virtual image)

uncorrected
corrected near point
near point

### PDF p.20 / printed p.23

Applying = - T+, we have
J 1,1
-4 u -02
u = 0.21053 m

Hence, the near point of the eye has moved 0.210 53 — 0.2 =
0.0105 m (or 1.05 cm) farther away from him.

The new range of vision is 21.1 cm to infinity.

After several years, John’s short sight has become worse and his Ans: More negative power
far point has become closer. Does he need to wear a new lens with
more positive power or negative power?

Ke a Example 1.5 Y Correction of long sight

Thomas cannot read a newspaper at a normal reading distance.
His near point is 2 m from him.

(a) Should a lens of positive or negative power be used to correct
the defect?

(b) Find the power of the corrective lens that allows him to clearly
see a newspaper that is 25 cm from his eye.

i SOUR esc cussercerncmmannanan EGS
(a) Alens of positive power should be used.
(b) Given: u =+0.25 m (positive for object distance) corrected
P 3 " uncorrected near point
v =-2 m (negative for virtual image) near point

Applying P = = +7, we have Leeer--t

1 1

0.25" —2 2m
=3.5D
The power of the corrective lens is +3.5 D. 4 The power of the corrective lens

for long sight must be positive.

### PDF p.21 / printed p.24

Vision and Hearing

Checkpoint @

Fanny suffers from short sight. Sketch ray diagrams
in the space below to show how her eye
accommodates to a near object and a far object.

(a) For a near object: (b) Fora far object:

Gordon suffers from long sight. Sketch ray
diagrams in the space below to show how his eye
accommodates to a near object and a far object.

(a) Fora near object: (b) Fora far object:

Helen is suffering from short sight. State whether
the following statements about her corrective lens
are correct or not.

(a) Itis convex.
(b) Its power is positive.

(c) It always produces a diminished image.

True or false:

(a) Short sight can be caused by a too long eyeball.

(b) Lenses of negative power are used to correct
long sight.

(c) Old sight is due to the decreasing elasticity of
the lens in the eye.

Ivan has a defective eye whose far point is 1.5m
away from him. Estimate the power of the
corrective lens needed.

Janet has a defective eye whose near point is 4.0 m
away from her. Estimate the power of the lens
needed to correct her near point to 25 cm.

The figure shows the structure of an eye. Which
part (a) refracts light the most and (b) has light
sensitive cells?

A. Ww ¥
B. Ww Zz
D. X Z

A thin convex lens and a thin concave lens have
focal lengths of 0.5 m and 0.1 m, respectively. What
is the total power of the lenses when they are
placed close to each other?

A. -8D B. +0.4D
C +15D D. +8D

How does a person's eye accommodate to a far
object?

ciliary muscle lens
A. contract thicken
B. contract flatten
C: relax thicken
D. relax flatten

The resolving power of an eye due to the diffraction
limit for two small light sources will be higher if

A. the light emitted has a longer wavelength.

B. _ the light sources are farther from the eye.

C. the pupil is larger in diameter.

D. the eyeball is smaller in size.

### PDF p.22 / printed p.25

The response of our eye to coloured lights peaks at

A. red.

B. green.
Cc. blue.
D. brown.

A lens has a power of +0.5 D. Which of the
following statements is correct?

A. The lens is concave.

B. The lens is for correcting long sight.
C. The focal length of the lens is 0.5 m.

The lens can only form real images.

10.

Joe is wearing a pair of glasses to correct his defect
of vision. However, one of the lenses can only
correct his far point from 5 m to 20 m. Suppose he
wants to see things at infinity clearly. Does he need
a lens with more positive or negative power? What
should the change in power be?

A. more positive, 0.05 D
B. more positive, 0.15 D
C. more negative, 0.05 D
D. more negative, 0.15 D

A tablet manufacturer
claims that the pixels
on the screen of its
product are so closely
packed that they
cannot be resolved

by the human eye
when the screen is viewed from a distance of

30 cm. What is the maximum separation of two
neighbouring pixels such that they cannot be

resolved? Take the wavelength of light to be 550 nm 13.

and the diameter of the pupil to be 5 mm.

Emily uses a phone camera to take pictures of two
objects O, and O,. Their images on the sensor are
separated by a distance s. The diameter and the
focal length of the lens are D and f, respectively.

lens

O; ee 1
6 5
——" sensor

11.

SB 14.

(a) Starting from 6,,,,. = Lad show that the
eae = ah 1.22Af
minimum value of s is given by s,,,, = D

such that the two objects can be resolved. State
any assumptions made.

(b) The width of one pixel in the sensor of
the camera is about 1.5 microns (1 micron =
10° m). Suppose the lens of the camera has a
focal length of 4 mm and the aperture has a
diameter of 1.8 mm. Is the resulting image
limited by the lens or the sensor? Take the
wavelength of light to be 500 nm.

Ken has a normal eye and the power of his eye
when viewing the far point is 59 D.

(a) Estimate the power of his eye when his eye
accommodates to an object 3 m away from him.

(b) Now Ken places a concave lens of focal length
0.5 m just in front of his eye. If he can still see a
distant object clearly, what is the power of his
eye now?

An object is placed 5 cm in front of a lens. An
image is caught by a translucent screen 10 cm
behind the lens.

(a) What kind of lens is it? What kind of defects of
vision can this lens correct?

(b) Find the power of the lens.

James suffers from long sight and he cannot clearly
see any objects within 1.5 m.

(a) Suggest Two possible causes for long sight.

(b) Find the power of the corrective lens that lets
him see clearly an object 22 cm away from him.

Mary has a defective eye. Its near point and far
point are 0.60 m and 20 m from her, respectively.

(a) What defect(s) of vision does she have?

(b) Find the power of the corrective lens that lets
the eye see clearly an object 0.25 m away.

Neville wears a pair of glasses to correct his defect
of vision. With the glasses, his near point changes
from 20 cm to 22 cm.

(a) Is the lens convex or concave? Briefly explain
without any calculations.

(b) Where is his uncorrected far point?

### PDF p.23 / printed p.26

eae Hearing

Hearing is another important sense that helps us perceive the
environment. In this section, we are going to learn how we can
perceive the environment through sounds.

Our ears

Let us begin by discussing the structures and functions of our
ears. In general, our ears can convert incoming sound waves
into electrical signals. A human ear can detect frequencies
between 20 and 20 000 Hz.

Basic structure

auditory

nerves

cochlea

eardrum

outer ear middle ear inner ear

Fig. 1.24 Structure of an ear

An ear can be divided into three main parts: outer, middle and
inner (Fig. 1.24). Their functions are as follows.

¢ The outer ear collects sounds from the surroundings and
guides them towards the middle ear.

e The middle ear converts the sound waves into mechanical
vibrations. It also amplifies the vibrations and transmits
them to the inner ear.

¢ The inner ear converts the vibrations into electrical signals
and sends them to the brain via auditory nerves.

Next, we shall discuss the function of each part in detail.

PEER ERE E HEHEHE EEE EEE EEE EEE EEE EEE HEHEHE HEHEHE HEHE HEHE HEHEHE THEEEEE EEE EEE EEE EEE EEE HEHEHE HEHE HEHEHE HEHEHE EEE HEHE EEE E HEHEHE HEED

outerear +H middleear*H innerear MH auditory nerve WAP

### PDF p.24 / printed p.27

[J Hearing mechanism

How are sounds amplified and converted? First, let’s have a
look at what happens when sounds arrive at the middle ear.

Pressure amplification

oval window

eardrum

Fig. 1.25 Middle ear and its lever action

When the eardrum is struck by some sound waves, it vibrates
at the same frequency as the waves and causes the ear bones to
move. The vibrations are eventually transmitted to the inner ear
via the oval window. During this process, the pressure on the
oval window becomes higher than that on the eardrum and the
amplification is twofold:

¢ The three ear bones act as a lever and amplify the force by
about 1.3 times.

e The area of the eardrum is about 17 times that of the oval
window.

Therefore, the pressure on the oval window is given by

force on the oval window _ 1.3 x force on the eardrum

area of the oval window area of the eardrum/17

= 22 x (pressure on the eardrum) 4) Put it another way, the total gain in
pressure is equal to the gain due to
lever action (1.3 times) multiplied by
the gain due to the area ratio (17 times),
i.e. 1.3 x 17 = 22 times.

SAAR E EERE EERE EEE EHH E HEHEHE HEHEHE EEE HEHEHE EEE HEHE EEE EEE HEHEHE HEHE HEHEHE EEEEEEEEE EEE HEHEHE EE EEE EEE HEHEHE HHH HHH HEHEHE HEE EEEEEE EEE E HEHEHE

eardrum H& oval window 3388

### PDF p.25 / printed p.28

Vision and Hearing

ik: Snapshot Daily Life

eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

Why can’t we hear properly when we have a cold?

The middle ear is an air-filled cavity and is
connected to the outside via a tube
(Eustachian tube). Normally, the air pressures
on the two sides of the eardrum are equal.
However, when a person catches a cold, fluid
may build up and block that tube. As a result,
it is more difficult for the eardrum to move in
and out due to the pressure difference on the a

‘ ustachian
two sides and hearing is thus affected. tube

Conversion to electrical signals

The vibrations are then transmitted to the cochlea in the inner
ear. The cochlea is a coiled tube that consists of three channels
filled with liquids. The upper and the lower channels are
connected at the apex. Incoming vibrations enter the cochlea via
the oval window, travel through the upper to the lower channel,
and finally leave via the round window.

oval window

round
window

PEER R RRR E HEHEHE TEETH EEE EEE EEE EEE EEE EEEEH HEHEHE HEHEHE EHHHHHHHEEETTTTEEHEEEE EEE EEE EEE HEHEHE HED

cochlea 348

Similar things happen to passengers
suffering from ear pain when an
airplane takes off. The air pressure
between the outer ear and the
middle ear is suddenly imbalanced,
making the eardrum unable to vibrate
freely.

eee Pee PPP CCPC eee rere eee ee eee ee eee eee eee eee eee eee)

### PDF p.26 / printed p.29

Fig. 1.27 shows a simplified diagram of an uncoiled cochlea.
There is a non-uniform structure called the basilar membrane
between the upper and the lower channels. When a vibration

is transmitted into the cochlea, some parts of the membrane
vibrate more than the others. This phenomenon is called

resonance,

It has been found that the basilar membrane near the base

vibrates more (resonates) at high frequencies and that near
the apex vibrates more at low frequencies.

ear oval
bone window

uncoiled cochlea

base

basilar
membrane

round
window

Fig. 1.27 How the basilar membrane responds to different frequencies

apex

high frequency

medium frequency

low frequency

A typical human ear can detect frequencies between 20 and

20 000 Hz. It can distinguish between two sounds with a
frequency difference of 2 to 3 Hz for sound waves of frequency
ranging from 60 to 1000 Hz.

The cells on the membrane are connected to auditory nerves
and send signals to the brain when they are stimulated. As a
result, the brain produces sense of hearing.

Fig. 1.28 summarizes how we hear.

<4 Sound of frequency higher than

20 000 Hz is called ultrasound.

sound waves
in air

vibration of
eardrum

pressure
amplified by
the ear bones

frequency
analysed by
the cochlea

signals generated
by the cochlea and
sent to the brain via
auditory nerves

signals interpreted
by the brain to give
the sense of hearing

Fig. 1.28 How we can hear

rr 2

SEAR E EERE EERE EEE HERR RHEE HEHEHE HEHE AHHH HHH EEE HEHEHE EEE HEHEHE EEE EE EH EEEHHHHHHH HHH H HEHEHE EEE THEE EEE HEHE HEHEHE EEE EEE EEE HHH H HEHE HEHEHE TEETH EE EEE HEHE EES

basilar membrane REM

resonance #i&

### PDF p.27 / printed p.30

Vision and Hearing

Snapshot

Greater wax moth

Bats, which can hear ultrasound up to a frequency of 200 kHz, have the
widest audible frequency range among mammals (human can only hear
sound up to a frequency of 20 kHz). However, some species can hear
sounds of even higher frequencies. The greater wax moth is one of them.

Researchers have found that the moth can hear frequencies up to 300 kHz.
The researchers suspect the moth is trying to outwit its main predator —
bats. First, the moth can hear ultrasound emitted by bats and try to avoid
them. Second, the moths can communicate with each other at high
frequencies which are outside the hearing range of bats.

Checkpoint @

1. Label the following parts in the diagram on the right:

auditory nerves, cochlea, ear bones, eardrum, inner
ear, middle ear, outer ear, oval window

2. Which part of the ear is responsible for the
following functions?

(a) Generating signals and sending them to the
brain to produce the sense of hearing

(b) Analysing the frequency of incoming sounds
(c) Converting sound waves into vibrations

(d) Amplifying the pressure on the oval window

3. True or false:

(a) The pressure acting on the eardrum is lower
than that on the oval window.

(b) The cochlea can amplify sounds.

(c) Sound waves are guided through the auditory
nerves to the brain.

### PDF p.28 / printed p.31

Sound intensity level

Apart from a higher or a lower pitch, our ear can also tell
whether a sound is louder or softer than another. Now, let us
study how our ears respond to loudness.

Intensity

Disco music is much louder than the light music heard in a
restaurant. But how much louder is the disco music? To describe
this in physics, we need to use the quantity intensity.

The intensity of a sound measures how much energy passes
through a unit area per unit time. Its unit is Wm. A sound
becomes more intense if

e the same amount of energy passes through a smaller area, or

* energy is transferred more rapidly or more energy is
transferred through the same size of area.

power =P, 1~._ power>P) ;

power =P) IT >~

3

as os

=> ~s J area < Ay
~~ J! area = Ay area = A,
(a) | = Py/Ag (b) / increases as the area decreases. (c) / increases as the power increases.
Fig. 1.29 Intensity /
©} Watch-out
Intensity and inverse-square law
In physics, intensity is the power transferred per unit
area. When a point source S radiates energy evenly in
all directions, the intensity measured at a certain
position from the source is related by
intensi
Y * Gistance”
which is called the inverse-square law. For example, if intensity = 1/4 at a distance 2 m from the loudspeaker,
the sound intensity measured at a distance 1 m from a intensity = 1/9 at a distance 3 m from the loudspeaker
small loudspeaker is /, we have: and so on.

SAREE ERE EEE HEHEHE EEE HEHEHE EEE HEHEHE HEHE HEHEHE HEHE TEESE HEHEHE HEHEHE HEHEHE HEHEHE HHH HEHEHE HEHEHE E EEE EEE HEHE EES

intensity 32

### PDF p.29 / printed p.32

ord Vision and Hearing

Decibel

Our ears can respond to a wide range of sound intensities, from
10°? to 10° W m~. To compare two sounds of different intensities
I, and I;, it is more convenient to use a logarithmic scale:

log iol 4 — logiols

The intensity of the softest sound we can just barely hear
is 1) = 10°? W m?. Taking this as the reference level, we can
define the sound intensity level L as

L = logo! 4 — logioly = 08

By convention, we use the decibel (dB) as the unit for the sound
intensity level. The above equation becomes

I,) . Fig. 1.30 The sound intensity level as
—| (in dB) shown by the meter is 98.5 dB.

0

Table 1.1 shows some typical intensity sound levels.

(a) the softest sound we 4 The softest sound we can barely hear
can barely hear actually depends on the frequency of
the sound. See p. 35 Fig. 1.32.

(b) whisper

(c) conversation at 0.5 m

causes hearing damage

RT Ae after long exposure

(e) loud rock music painful to ears

(f) jet engine at 50 m

immediate permanent
hearing damage

(g) space shuttle engine

Table 1.1 Typical sound intensity levels

PEER RR RR EEE HEHEHE EEE EEE HEHEHE EE EEE EEE EEE EEE E EEE H HEHEHE HEHEHE HEHEHE E EEE E EEE EEE HEHEHE EEE EEE HEHEHE HEHEHE HEHE EHEEEEEEEEEEEEEEE EEE EEE EEE EEE ED

sound intensity level #4 decibel 7A

### PDF p.30 / printed p.33

L Sound intensity level

Janet is in front of a loudspeaker which is producing sounds.
The sound intensity that Janet hears is 10° W m~.

(a) What is the sound intensity level?

(b) The power output of the loudspeaker is now doubled. Find the
increase in the intensity level.

Take I, = 107? W m?.

Se) (0 te)
(a) The sound intensity level is

-8
0

(b) When the power is doubled, the intensity is also doubled, i.e.
the new intensity I' = 2]. Therefore, the new intensity level is

0

The increase in sound intensity level is 10 log), 2 = 3.01 dB.

i OE is op rescence eesseery eer ene

What is the increase in the intensity level if the power output is Ans: 6.02 dB (= 10 log, 4)
4 times the original?

Checkpoint @

1. When the intensity of a sound doubles, the sound 3. Fill in the table below.
intensity level increases by about 3 dB. What is the
change in the sound intensity level if the intensity

intensity /W m7 | intensity level / dB

of the sound is halved? softest sound 10°? 0
we can hear

A. -3 dB rustling leaves 10

B. -1.5 dB quiet home 35

C. -0.333 dB normal 106
conversation

2. By what factor is the intensity increased when the disco 0.05

sound intensity level increases by 10 dB?

A. 2

B. 10

Cc. 100

### PDF p.31 / printed p.34

oe Vision and Hearing

1b) Perception of sound

Hearing range

Our hearing is limited within a frequency range from 20 to
20 000 Hz. At the same time, we cannot hear sounds that are
too loud or too soft.

The intensity level of the softest sound we can barely hear

is about 0 dB (= 10°'* W m”). However, this may vary from

frequency to frequency. Fig. 1.31 shows the hearing range of

a human. By connecting the lowest sound intensity levels for

different frequencies, we can obtain the curve for the threshold

of hearing. The curve dips to the lowest point at about 2 kHz. 4 i.e. the ear is most sensitive at about
Sounds below that curve cannot be heard. o kN

The graph also shows two other curves, namely the threshold of
discomfort (blue curve) and the threshold of pain (orange curve).
Sounds above the threshold of discomfort make the listener feel
like he is being tickled in his ear as the ear bones strike the wall
of the middle ear. Sounds above the threshold of pain make it
painful to listen and may even rupture the eardrum.

sound intensity level / dB threshold of pain threshold of discomfort
1
rangeof oJ
100 = audible sound |
1
80 - '
wef er eee !
1
60 - '
1
Bee Deals en tee eae !
40 - '
205 ££ NOT St en ne nnn nnn
propa Note that the threshold of hearing varies
po | SER greatly with frequency.
T T T # frequency / Hz
1 100 1000 10 000

Fig. 1.31 Range of audible sound

PEER RRR REE E HEHEHE HEHEHE EEE EEE HEHEHE EEE EEE EEE HEHEHE HEHEHE HEHEHE HEHEHE EHEE EEE HEHEHE HEHEHE EEE EEE HHH HEHEHE HEHE HEHEHE EEEEEEHEHEH EEE HEHEHE EEE ED

threshold of hearing (A/a

### PDF p.32 / printed p.35

Loudness and phon

Fig. 1.31 also suggests that the threshold of hearing varies with
frequency. Similarly, sounds that give a person the same sense
of loudness also do. This can be illustrated by curves of equal

loudness (Fig. 1.32).

intensity level / dB

= SSS SSS ici ieee

4 120 phons

{threshold of
120 fl RRR area  i en rr — - discomfort)

! 80 phons
80 p= = = = ne

40 phons

0 phons
(threshold of
hearing)

T 1 T
100 1000 10 000

Fig. 1.32 Curves of equal loudness (using 1000 Hz as a reference tone)

To measure loudness, which depends on the listener, we can use
the phon scale instead of the decibel scale. On this scale, a pure

Note that the curves are higher up
at both ends. This means, the ear is
less sensitive to sound of low and
high frequencies, compared to middle
frequencies. It needs a higher sound
intensity to give the same loudness in
these two ranges.

w frequency / Hz

<4) The curves (or contours) of equal
loudness are based on statistical
averages. Actually, everyone has a
slightly different set of curves. The
curves are also known as Fletcher-
Munson curves.

note of 1000 Hz is used for reference. For example, a note that
is as loud as a pure note of 40 dB at 1000 Hz has a loudness of

40 phons.

Snapshot

Weighted decibels

From Fig. 1.32, we can see that a sound of 40 phons has an
intensity level of 40 dB at 1000 Hz, but 80 dB at 100 Hz. As
the human ear is not equally sensitive to all frequencies, a
weighted factor is developed to adjust the decibel scale so as
to mimic the response of the human ear to different sound
intensity levels. There are A-, B-, C- and D-weighted decibels,
among which the A-weighted scale (roughly follows the
40-phon curve) is most commonly used.

In the A-weighted scale, sound intensity levels are adjusted
according to the graph on the right (e.g. sound of 1000 Hz
has to add 0 dB). The unit of the resulting value is dB(A). The
dB(A) is often used for measuring environmental noise as it
reflects more accurately the frequency response of the human
ear than cB.

DEERE E HEHEHE EHH E HEHE EEE HEHEHE HEHE EEE HEE

adjustment of
sound intensity level / dB

-10-

wee ee em eR em em em er er er ee ee

frequency / Hz

BS 1000 2000 16000

DEERE EEE EEE EEE EE EEE EERE EEE HEHEHE HEHEHE EEE HEHE EHH H HEE ED

### PDF p.33 / printed p.36

ord Vision and Hearing
L mee, Example 1.7 The phon scale

The figure below shows several curves of equal loudness.

sound intensity level / dB
4

140
Se a
“| 120 phons
120 -——
100 100 pho
0

80

60

40

20

0 Lj
20 100 1000 10 000

frequency / Hz

(a) What is the loudness of a 40 dB sound at 90 Hz?

(b) Which sound is louder, a 60 dB sound at 100 Hz or a 60 dB
sound at 10 000 Hz? Briefly explain.

(c) Suppose the intensity of a sound of 60 phons at 50 Hz is J; and
that of a sound with the same loudness at 1000 Hz is /,. Find
the ratio I, : I,.

Fi aN IN cy re erg aac cee rc rere nero net eras

(a) From the above figure, the loudness of the sound is 0 phon.
(b) A 60 dB sound at 10 000 Hz is louder.

Its loudness is about 50 phons but the loudness of a 60 dB
sound at 100 Hz is only about 40 phons.

(c) The intensity level of a sound of 60 phons at 50 Hz is 80 dB.
The intensity level of a sound of 60 phons at 1000 Hz is 60 dB.
The change in intensity level is 60 — 80 = -20 dB. Therefore,

change in intensity level = 10 - log),

—|—10-logio

A 09.05 = (0g, .A — log ,.8

### PDF p.34 / printed p.37

13] Noise and hearing

If a person suffers from hearing loss, the aforementioned
hearing range may shrink. Hearing loss can be caused by
damage to the middle ear or damage to the cochlea and
the nerves.

Noise is one of the causes of
such damage. Depending on
the exposure time to noise and
its intensity, hearing loss can
be temporary or permanent.
For instance, exposure to noise
of 85 dB for 8 hours or more
can cause hearing loss, with
louder sounds causing damage

in a shorter period of time. Fig. 1.33 Noise can be produced by construction, traffic, aircrafts etc.

Fig. 1.34 shows how the threshold of hearing may change due
to hearing loss. For example, the hearing of a person becomes
worse as he gets older and his curve for threshold of hearing
shifts upwards.

Another example is a person suffering from hearing loss
due to noise. His overall hearing has become worse (as his
curve for threshold of hearing shifts upwards). The ‘crest’ in
the curve further shows that his hearing was damaged more
seriously for a certain range of frequencies. This is typical
for workers exposed to loud noise from machinery without
adequate protection.

sound intensity level / dB

4
— threshold of hearing for
hearing a person suffering from
t an age-related hearing loss
threshold of hearing for
a person suffering from a
| noise-related hearing loss
o- ‘ited threshold of hearing for
—- a person with normal hearing
> frequency / Hz
0

Fig. 1.34 Curves of equal loudness for an elderly and a person suffering from
noise-related hearing loss

<The curve of the threshold of hearing for
a person suffering from hearing loss may
only shift upwards without any ‘crests’.

### PDF p.35 / printed p.38

Vision and Hearing

Checkpoint @

Snapshot

Hearing aid and cochlea implant

A patient suffering from hearing loss may rely on a
hearing aid. He must receive a hearing test in order to
identify what type of hearing loss he has and which
frequency range of his hearing is affected. The hearing
aid is adjusted to amplify sounds of certain frequencies
so as to compensate for his hearing loss.

However, a hearing aid cannot help a patient whose
cochlea or auditory nerves are damaged. In this case,
the patient may need a cochlear implant. A cochlear
implant consists of an external part which usually sits
behind the ear and an internal part which is surgically
implanted into the cochlea. The external part picks up
sounds from the environment and converts them into
electrical signals. The signals are sent directly to the
internal part, which then sends the signals to the
corresponding auditory nerves.

Although an implant does not restore normal hearing,
it can give a deaf person a useful representation of
sounds in the environment.

What is the reference frequency when defining
phons?

A. 100 Hz B. 1000 Hz C. 10000 Hz

Amy has normal hearing and can hear a sound of
10 phons at 10 000 Hz. A change is made to the
sound source and Amy can no longer hear any
sound. Which of the following is Nor a possible
change? You need to refer to the curves of equal
loudness in Example 1.7 on p. 36.

A. The intensity level has dropped by 20 dB.
B. The frequency has been tripled.

C. The frequency has been reduced by
a factor of 0.1.

Which of the following statements about hearing
loss is correct?

A. The threshold of hearing for a person with
hearing loss is lower than 0 dB.

B. Hearing loss due to noise can only be
temporary.

C. Only sound of intensity level 120 dB or above
can cause hearing loss.

D. None of the above

True or false:

(a) We cannot hear any sound softer than 0 phon.

(b) The sounds on the same curve of equal
loudness have the same intensity.

(c) The loudness of a sound depends on the
frequency.

Based on the curves of equal loudness in
Example 1.7 on p. 36, answer the following
questions.

(a) What is the loudness in phons for a sound of
intensity level 80 dB at 1000 Hz?

(b) What is the intensity level of a sound at
6000 Hz that has a loudness of 20 phons?

(c) Which sound is louder, a sound of 50 dB at
100 Hz or a sound of 40 dB at 10 000 Hz?

(d) Does a sound of 50 phons increase or decrease

in intensity level when its frequency changes
from 100 Hz to 1000 Hz?

### PDF p.36 / printed p.39

Exercise

1. Which of the following statements about the
eardrum is INCORRECT?

A. It separates the outer ear and the middle ear.

B. _ Its area is smaller than the oval window.

C. It vibrates at the same frequency as the
incoming sound.

D. It can amplify the sound incident on it.

2. The pressure amplification in the middle ear is
twofold. What are the two factors?

factor 1 factor 2

A. The moment arm The eardrum has
acting on the eardrum a larger surface
is longer than that on area than the oval
the oval window. window.

B. The moment arm The eardrum has
acting on the eardrum a smaller surface
is longer than thaton area than the oval
the oval window. window.

C. The moment arm The eardrum has
acting by the eardrum a larger surface
is shorter than thaton area than the oval
the oval window. window.

D. The moment arm The eardrum has

3. Which of the following statements about the inner

acting by the eardrum
is shorter than that on
the oval window.

ear is correct?

a smaller surface
area than the oval
window.

A. The auditory nerves transmit the vibrations to
the brain.

The cochlea is filled with air.

C. Vibrations are transmitted into the cochlea
through the oval window.

D. Vibrations are completely absorbed in the
cochlea.

4. The intensity of a sound is initially 10° W m~. Its
intensity is now increased to 10” W m®*. What is
the increase in intensity level?

A 3dB B. 5dB
C. 30dB D. 50dB

A loudspeaker emits a sound. The intensity level
measured a certain distance away is 50 dB. The
power output of the loudspeaker is now reduced
and the intensity level becomes 43 dB. By what
percentage has the power been reduced?

A. 15%
B. 20%
C. 80%
D. 85%

A 1000 Hz sound has a loudness of 15 phons. What
is the intensity level of the sound?

A. OdB B. 5dB
C. 10dB D. 15 dB

Which of the following statements about a curve of
equal loudness is correct?

A The unit of the horizontal axis for the curve is
the phon.

B. It becomes flatter for louder sounds.
C. Its lowest point is fixed at 1000 Hz.
D.  Itis independent of the listener.

Briefly describe the functions of the outer ear, the
middle ear and the inner ear.

The intensity level of a sound played by a
loudspeaker is 60 dB at a certain distance away
from the loudspeaker. What is the new intensity
level if the power output of the loudspeaker is
increased by 50%?

### PDF p.37 / printed p.40

Vision and Hearing

10. Mike hears two sounds and both of them have the
same intensity of 1.00 x 10” W m™. Calculate the
total sound intensity level in dB. Take the threshold
of hearing to be 10? W m*.

11. The figure shows how the threshold of hearing for
a normal person varies with frequency f. (L = sound
intensity level)

L/ dB

120-7

20 000 {in log scale)

(a) Shade and label the region for the range of
audible sound.

(b) Sketch, on the same graph, the curve for
threshold of hearing for an elderly.

(c) John is a worker in a factory and has been
exposed to loud noise for a prolonged period.
Unfortunately, he suffers from hearing loss
due to his work. Briefly describe how his curve
of threshold of hearing is affected.

& 12. Fig. Q12 shows two curves of equal loudness.

intensity level / dB

120-
100 =
80 4
60 40 phons
40 _
207 0 phon
(threshold of
0- hearing)

LU T
100 1000 10 000
Qi2

What is the meaning of a curve of equal
loudness?

Sketch the curve of equal loudness for

120 phons.

Describe how the loudness of a 40 dB sound
change when its frequency drops from 1000 Hz
to 100 Hz.

Estimate the change in intensity when the

frequency of a 40 phon sound increases from
100 Hz to 1000 Hz.

w frequency / Hz

### PDF p.38 / printed p.41

Summary
Key Ideas

eee eee ee eee eee eee eee eee eee eee ee eee ee

Human vision

¢ How we see things

Summary Ws

eee eee ee eee eee eee eee eee ee eee eee eee ee)

light from re

an object
cornea, image rods and cones signals sent signals
lens (and formed convert light to the brain interpreted by
fluids) on retina into electrical via optic the brain to
refract light nerves produce vision
¢ Main components Spectral response of eye
cornea does the most refraction of light ¢ Three types of cones and rods have various

focuses light onto the retina by
changing shape

lens

itETeurata change the thickness of lens

consists of light sensitive cells
retina ¢ rod cell: for dim-light conditions

* cone cell: for perception of colours

How we see

¢ Power P of a lens: P = ; (unit: dioptre, D)

¢ Accommodation: focusing on objects at various

distances by the eye
viewing near objects viewing distant objects
ciliary muscle ciliary muscle
contracts relaxes

lens is thick
initially

lens pulled flat
and becomes thin

¢ Minimum angular separation 0,,;,, between two
objects for the eye to resolve

AEA,
rnin bias D

(in radians)

(A: wavelength of the light; D: diameter of the pupil)

sensitivities to lights of different wavelengths
and intensities.

¢ Enable people to distinguish between different
colours

¢ See p. 16 for receptor absorption curves

Defect of vision and correction

Short sight (eye is too powerful/eyeball is too long)

uncorrected
far point
ar poi
correction: decrease eye’s power with a concave lens
corrected far point concave lens
at infinity
a aw peepee sien yeni ieee |
F sacs Some |
uncorrected
far point

corrected near point

uncorrected
near point

### PDF p.39 / printed p.42

orl Vision and Hearing

¢ Long sight (eye is too weak/eyeball is too short)

normal
near point
(25 cm)
uncorrected elias
near point

correction: increase eye’s power with a convex lens

convex lens

¢ Old sight (lens is not elastic enough)

correction: increase eye’s power when seeing a near
object and decrease eye’s power when seeing a
distant object

frequency

by cochlea

signals (generated signals interpreted
by cochlea) sent by the brain to give
to the brain via sense of hearing

auditory nerves

uncorrected g. = =--- ~~». se
near point Sy =
corrected
near point
(25 cm)
Human hearing
¢ How we can hear
incoming
sound
waves vibration pressure
of amplified analysed
eardrum by ear
bones
¢ Hearing mechanism
Combined effect of
Pressure 1. lever action of three ear bones

amplification

2. area ratio of eardrum and oval
window

Processed in cochlea

Analysis 1. Regions near the base vibrate more

of sound at high frequencies.

ignal
signals 2. Regions near the apex vibrate more

at Low frequencies.

¢ Sound intensity level L

L=10- al (in dB)
0

Response of human ear

¢ Human ears can hear a certain range of audible
sound (see Fig. 1.31, p. 34).

¢ Hearing loss is caused by aging, or exposure to noise.

=< 58

¢ Curves of equal loudness:

e¢ Each curve represents sounds of various
intensities and frequencies perceived by people
as equally loud.

intensity level / dB
4 120 phons

(threshold of
100+ = = nr discomfort)

0 phons
(threshold of
hearing)

100 1000 10 000
frequency / Hz

¢ Effects on hearing due to hearing loss:
see Fig. 1.34, p. 37

### PDF p.40 / printed p.43

Keywords

Summary Ws

eee eee eee eee eee eee eee eee eee eee eee eee eee eee eee ee

accommodation #.4¢i4 fii
auditory nerve i}
basilar membrane 4# iC
blind spot Fil

cochlea 1-8

cone {aE

cornea ff ft

curve of equal loudness % #4 #
decibel 47 A

dioptre HIER

eardrum #-lit

far point 1%

Common Mistakes

inner ear (4) H-
intensity */

lens Aiikte

long sight 2
middle ear '}'4-
near point #84

old sight #4

optic nerve tifa
outer ear 9}.

oval window 5 i
phon 7

power (of a lens) 129048 ii

pupil fii¢L

receptor absorption
Curve ARS gi Mic HH A

resolving power SP }#fié JJ
resonance ttiik

retina Mii

rod ff

short sight # #2

sound intensity level # a
spectral response J£i4 /2 Me
threshold of hearing ¥64th4
yellow spot #iMh

CEE EEE EEE EEE EEE EEE EEE EERO!

ee ac
ey bt
lens \ / lens

relaxes / moves
to see by itself / towards
distant / retina

object

/ muscles
contract
— lens thinner

L+10dB

___ sound intensity /
es sound intensity level L
Ix2
L+3dB

L+10dB

ciliary muscles relax 10 dB/2 48
— lens thinner WA sian: per
Ht aes fd

M Note that in the process of accommodation, I
find the change in sound intensity with the

M Always use the formula L = 10: logio( 4B to

(1) only the power of the lens varies.

(2) ciliary muscles relax to make the lens thinner
(and contract to make the lens thicker).

° power of the lens:
P,=+2D
P,=4+2D
P,=+2D
P,=-2D JS

f£=0.5m £=05m

corresponding sound intensity level, and vice versa.

M Using the lens formula, a concave lens has a
negative power.

### PDF p.41 / printed p.44

Vision and Hearing

Chapter Exercise

Multiple-choice Questions

eee eee eee eee eee ee eee eee ee eee eee ee eee eee eee eee)

The figure shows two points A and B on the retina.
Which of the following diagrams best represents the

distribution of cones from A to B?
(N: number of cones)

Ben is staring at a moving object. The thickness of his
lens gradually increases as the object moves. Which
of the following statements is correct?

A. The object is moving away from him.
B. The ciliary muscle gradually contracts.
C. The power of his eye gradually decreases.

D. The focal length of the lens gradually increases.

A lens has a power of +0.5 D. Which of the following
statements about the lens are correct?

(1) It is a convex lens.

(2) Its focal length is 200 cm.

(3) It can be used to correct long sight.

A. (1) and (2) only B. (1) and (3) only
C. (2) and (3) only D. (1), (2) and (3)

A lens forms a virtual image at a distance of 5 m
from it. The linear magnification of the image is 3.
What is the power of the lens? Is the lens corrective
for short sight or long sight?

A. +0.4D, short sight
B. +0.4D, long sight
C. +0.8D, short sight
D. +0.8 D, long sight

Timothy is suffering from short sight and his far
point is 2m. Which of the following statements are
correct?

(1) When he views an object 1 m away from him,
the image is formed behind the retina.

(2) When he views an object 4 m away from him,
the image is formed in front of the retina.

(3) The focal length of the lens to correct his defect
should be 2 m.

A. (1) and (2) only B. (1) and (3) only
C. (2) and (3) only D. (1), (2) and (3)

The figure shows how parallel light rays enter a
defective eye of a person. Which of the following
statements are correct?

(1) The far point of the eye is Nor at infinity.

(2) The person may suffer from long sight.

(3) Aconcave lens can be used to correct the defect.
A. (1) and (2) only B. (1) and (3) only
C. (2) and (3) only D. (1), (2) and (3)

Jenny has a near point 4 m from her eyes. Find the
power of the lens that can correct the near point to
0.25 m.

A. +3.75D B. +0.267D

C. -0.267D D. -3.75D

The intensity level of a sound is increased from 20 dB
to 35 dB. What is the intensity ratio of the initial
sound to the final sound?

As T3iZ Be: "Tes

C Lsie De Lame

### PDF p.42 / printed p.45

10.

11,

The sound intensity iz
level in an empty
classroom is 30 dB.
When 40 physics
students are in the
room, the intensity
level becomes 70 dB.
What is the intensity level if there are only 20 students?
Assume that all students are equally noisy. Take the
threshold of hearing to be 10? W m?.
A. 35dB B. 50dB
C. 60dB D. 67 dB
Which of the following statements about the
threshold of hearing are correct?
(1) A-sound of 0 dB is the softest sound a human
can hear for all frequencies.
(2) The intensity of a sound at 0 dB is 0 W m”?.
(3) The threshold of hearing is different for sounds
of different frequencies.
A. (3) only B. (1) and (2) only
C. (1) and (3) only D. (1), (2) and (3)
Which of the following graphs best shows the
threshold of hearing of a normal person? 3
(L: sound intensity level, f: frequency of sound) ;
4 4
= ian
0 20 000 0 20 000
f/ Hz f/ Hz
(in log scale) (in log scale)
Cc D.
A 4
; = inet
0 20 000 0 20 000 14.
f / Hz f/ Hz
(in log scale) {in log scale)

Chapter Exercise Ds

The figure below shows a curve of equal loudness.

sound intensity level / dB
140 4
1207
100
80-4

60-

alii

20 100 1000 10 000

frequency / Hz

Which of the following statements is/are correct?

(1)

The curve represents sounds of loudness of

60 phons.

(2) A60 dB sound at 10 000 Hz is louder than a
60 dB sound at 100 Hz.

(3) When the frequency of a 60 dB sound increases
from 100 to 1000 Hz, its loudness decreases.

A. (1) only B. (2) only

C. (1) and (3) only D. (2) and (3) only

HKDSE 2012 Three musicians play three different
notes P, Q and R. The loudness of these notes as
heard by an audience is the same and the notes are
shown in the equal loudness graph below. Their play
is picked up by a microphone and is then reproduced
by a loudspeaker at 20 dB above the original sound
intensity level. Which of the following is the order

of the loudness of the reproduced sound?

‘sound intensity level / dB

90 = curves of equal

— a ni loudness
80 ++ -<e_-=

70 =
60 -
50 =
= frequency
A. P=Q=R B. P>R>Q
Gy Baga P D. Q>R>P

HKDSE 2013 Two point objects of separation 5 mm
emitting green light of wavelength 550 nm are
observed by Jacky. Assume that the diameter of the
pupils of his eyes is about 3 mm in normal daylight.
Estimate the maximum distance of the two objects
from him such that he can still resolve them.

### PDF p.43 / printed p.46

Vision and Hearing

15.

16.

17.

18.

A. 42.4m B. 242m

C. 224m D. 20.4m

HKDSE 2013 The diagram shows —

an eyeball of a person suffering from () \

an eye defect. The distance between \ )

the retina and optical centre of the Batt
2.0¢

refracting parts is 2.0 cm while the
minimum power of the refracting parts is +55 D.
What is the power of the spectacles required to
correct the defect?

A. -5D B.
Cc. +5D Ds:

-10D
+10D

HKDSE 2013 The sensitivity of the human ear

is high because the pressure change in a sound wave
is greatly amplified before reaching the inner ear.
Which of the following facts contribute to this large
amplification?

(1) When the ear bones transmit the vibrations from
the eardrum to the oval window of the inner
ear, lever action occurs.

(2)

The eardrum has a much larger area than the
oval window of the inner ear.

(3) The inner ear is filled with a liquid which has
a much higher density than that of air outside.

A. (1) and (2) only B. (1) and (3) only

C. (2) and (3) only D. (1), (2) and (3)

HKDSE 2013 A speaker is connected to an amplifier
to produce sound. When the power supplied to the
speaker is 50 W, the resulting sound intensity level at
a certain location is 100 dB. Assume that there is no
other sound source and the speaker has a fixed
efficiency of converting electrical energy to sound.
What is the power required to produce a sound
intensity level of 110 dB at the same location?

A. 52W B. 55W
Cc. 100W D. 500W

HKDSE 2014 Mr. Lee wears a pair of bifocal lenses
as shown. The respective powers of the upper half

and the lower half of each lens are -1.5 D and +2.0 D. 20.

Which of the following statements is/are correct?

-1.5D

+2.0D

. ASnellen chart is used to test

(1) The upper half is for viewing distant objects
while the lower half is for viewing objects at a
close distance.

(2) Mr. Lee only suffers from old sight (presbyopia).

(3) Without the spectacles, Mr. Lee cANNoT see an
object clearly no matter how far it is placed
from him.

A. (1) only B. (3) only

C. (1) and (2) only D. (2) and (3) only

Structured Questions

eee ee ee eee eee ee)

how acute your vision is.
Vicky is now 6 m away from
the chart and attempts to view
the letter E of height 88 mm.

Take the pupil's diameter to be

5 mm and the wavelength of

light to be 550 nm.

(a) For two objects that are 6 m from a viewer to be
resolvable, what is their minimum angular
separation? (2 marks)

(b) What is the angle, in radians, subtended by the
letter E from Vicky’s eye? Do you think she can

resolve the letter if her eye is normal? —_ (2 marks)

(c) Besides diffraction, state another factor that may

affect how acute a person's vision is. (1 mark)

(d) Suppose the cornea is 2 cm away from the retina
for Vicky’s eye and assume all refraction takes
place at the cornea.

(i) Suppose Vicky’s eye is normal. What is the
power of her eye when it accommodates to
the chart? (2 marks)
Suppose Vicky's eye is defective and has a
far point of 4 m. Should a convex lens or
concave lens be used to correct the defect?

What is the power of her eye when she
accommodates to the chart with the

corrective lens? (3 marks)

Two objects, A and B, are 0.2 m and 5 m away from
an eye, respectively. The near point of the eye is
0.2 m. Assume all refraction takes place at the air—
cornea boundary.

near point

—— 4.8 m —ee— 0.2 m—1

### PDF p.44 / printed p.47

21.

(a) Briefly describe what a near point is. (1 mark)
(b) At the instant shown, the image of A is formed
on the retina, which is 2 cm behind the cornea.
(i) What are the power and the effective focal

length of the eye? (3 marks)

(ii) At this moment, where is the image of B? Is

it in front of, behind or on the retina?

Explain briefly. (2 marks)
(c) The eye now changes its focus on B.
(i) Name the process. (1 mark)
(ii) Describe how the ciliary muscle and the
lens change in the process. (2 marks)

(iii) Find the change in power of the eye. (2 marks)

The figure shows the cross-sections of two contact
lenses, A and B.

contact lens A contact lens B

(a) One of the lenses is used to correct short sight.
(i) Which one is it? (1 mark)
(ii) Suggest rwo possible causes for short sight.
(2 marks)

(b) The lens in (a) is used to correct the far point of
a person from 2.0 m to infinity.

(i) What should the power of the lens be?
(2 marks)

(ii) Complete the ray diagrams below for the
eye of the person. (2 marks)

rays from a distant
point object

Chapter Exercise Ds

(iii) Sketch a ray diagram to show how the lens
can correct the defect. (2 marks)

corrective lens

22. The figure shows several curves of equal loudness.

sound intensity level / dB
4

1404
120 —— 120 phons La
1004—- an
804 80 phons
604 NO
20-
04
' LU T >
20 100 1000 10 000

frequency / Hz

(a) What is a curve of equal loudness? (1 mark)
(b) Give Two factors that determine the loudness

(2 marks)
(c) What is the threshold of hearing in dB when the

frequency of a sound is 1000 Hz? (1 mark)

of a sound.

(d) By what factor has the intensity changed when
the frequency of a 40 phon sound changes from
30 Hz to 1000 Hz. (3 marks)

(e) Aman suffers from hearing loss as he gets older.
Sketch a curve of 0 phon to represent his

hearing. (1 mark)

. This question is about human hearing.

(a) Briefly describe the physical processes in the ear
that produces a sense of hearing, starting from
the incidence of sound on the eardrum. (4 marks)

A loudspeaker connected to a signal generator is
producing a tone of 1000 Hz at a constant power.
The graph on the next page shows how the sound
intensity / varies with the distance r from the
loudspeaker. The threshold of hearing is

I)=10°? W m®.

### PDF p.45 / printed p.48

Vision and Hearing

24.

1/mWm
1.6
1.4
12
1.0
0.8
0.6
0.4

0 oo »r/m

12 3 4 5

James is initially 1 m in front of the loudspeaker.
(i) What is the sound intensity level heard?
(2 marks)

(ii) How far backwards should he step so that

the sound intensity level heard is reduced

by 6 dB? (2 marks)
Jane stands at a certain distance from the
loudspeaker. Suggest Two ways to adjust the
signal generator so that the loudness of the
sound heard is reduced. (2 marks)

AQA A-level PHA6 Jun 2008 The fovea (yellow
spot) in the human eye consists only of cones which
have an average diameter of 1.5 um.

On the axes sketch and clearly label THREE
curves to show how the response of each of the
three types of cone in the fovea varies with the
wavelength of light. (3 marks)

relative light absorption

4

0

700 wavelength / nm

300 400 500 600
An eye looks directly at two point sources of
light which are 8 mm apart and 40 m distant
from the eye. The fovea is 19 mm behind the eye
lens at the centre of the retina.

(i) Calculate the separation of the two images
(2 marks)

(ii) State, with a reason, whether the eye would

at the fovea.

be able to resolve the two images formed at
the fovea. (2 marks)

25. IB Higher level Nov 2010 This question is about
sound intensity.

Define
(i) intensity of sound. (1 mark)
(ii) sound intensity level. (1 mark)

State rwo ways by which the sound pressure at
the eardrum is amplified before reaching the

(2 marks)
A student with a hearing problem can hear
sounds clearly when the sound intensity level is
65 dB or higher. In a large lecture hall, at a
distance of 25 m from the lecturer, the sound
intensity level is 55 dB.

cochlear fluid.

Determine the maximum distance from the
lecturer at which the student can hear clearly.
The intensity of sound a distance d from a

source of power P is given by | = a . (4marks)

26. AQA A-level PHYAS/2B Jun 2011

63 cm

A person suffering from long sight has an
unaided near point 63 cm from the eye. The
figure shows three diagrams not drawn to scale.
The first two diagrams show rays incident on
the unaided eye. The third diagram shows rays
incident on the correcting lens which will allow
the person to have an aided near point 25 cm
from the eye. Complete the diagrams to show
the passage of the rays to the retina. You may
assume that for the eye there is only a single

refraction at the cornea of the eye. (2 marks)

25cm

(b) Calculate the focal length of the correcting lens,

stating the answer to the appropriate number of

significant figures. (3 marks)

Explain what is meant by persistence of vision
and state a practical situation where it is

important. (2 marks)
(Note: This part is out of the current syllabus. ]

### PDF p.46 / printed p.49

27. AQA A-level PHYAS/2B Jun 2013

(a) Sound waves are incident on the ear canal of
a normal human ear. Describe the physical
processes involved in the transmission of the
energy from the air through to the inner ear.
Include an outline of how the variations in air
pressure in the ear canal are amplified to
produce greater pressure variations in the
inner ear.

The quality of your written communication will
(6 marks)

(2 marks)
(c) Ahuman ear has a threshold of hearing of 54 dB

be assessed in your answer.
(b) Define intensity of sound.

at a given frequency. Calculate the intensity
of sound incident on the ear at this frequency.
Give your answer to an appropriate number
of significant figures.
1, =1.0 «107? W m®

28. IB Higher level May 2013 This question is about the

human ear.

The di th . a
(a) e diagram on the (NN

right is a schematic of | (*

a model to represent ie
the ear. (ossicles = \ aor
ear bones) Wr
(i) Identify the parts of

the ear represented by A and B.

(ii) Outline, with reference to the diagram, the

mechanism by which amplification is
carried out in the middle ear.

(b) Explain, with reference to the acoustic

properties of the media concerned, why sound

CANNOT be transmitted directly from air to the

inner ear efficiently.
(Note: This part will be introduced in Ch. 2.]

(c) Distinguish between loudness and intensity.

(2 marks)

(d) Asa result of exposure to noise, a person has
suffered a hearing loss of 15 dB at 10 kHz. At
low frequencies, the person’s hearing remains
normal.

The graph shows the variations with frequency

of the threshold of hearing for this person.

Draw a line on the graph to show the threshold

of hearing for a person with normal hearing.

(2 marks)

(3 marks)

(1 mark)

(2 marks)

(2 marks)

Chapter Exercise Ds

intensity level / dB

UT ee Sees ; aA
i + + T ttt t
70 4
60
50 a——_ _ + —}——}— +4
404 \
30 ae
i t t r f co a
20 4+— i ~ ees
t + A ttt
10 +— ~ PtH
a + } rie —. . t +
—— eas
t quency / Hz
-10 {bt | ce ‘a —
10 100 1000 10° 10°
29. HKDSE 2014 [Part (a) belongs to Ch. 2.]
(a) (i) In medical imaging using ultrasound, a
piezoelectric transducer is employed to
scan the patient. Describe how a
piezoelectric transducer generates
ultrasound waves. (2 marks)

(iii)

State onE advantage and one disadvantage
of using ultrasound of higher frequencies
in medical imaging. (2 marks)
John has normal eyesight and the power of
his eye is +59 D in viewing distant objects.
Estimate the separation between the lens
and the retina of his eye. Assume that the
refracting power is mainly contributed by

the eye lens. (2 marks)
The display panel of a <——»|
smart phone X is made | .

up of numerous tiny
square pixels as shown.
John is looking at the
graphics on the display
panel of smart phone
X. The diameter of his
eye’s pupil is 4.0 mm. Estimate the
resolving power 6@ (in radians) of his eye for

square pixels of part of
the display panel

graphics in green colour.

Given: wavelength of green light =
5.35 x 107 m.

The pixels of smart phone X are so small
that the human eye is unable to distinguish
two adjacent pixels at a typical viewing
distance L = 0.30 m. Using the result of (b)
(ii), estimate the maximum length of a side
of a square pixel, r, on the display panel of
smart phone X. You may assume that for

(2 marks)

0 —

(2 marks)

small angle @ in radians, tan 0 = 0.

