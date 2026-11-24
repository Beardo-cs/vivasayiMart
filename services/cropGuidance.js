// The only problems Vivasayi AI may name, and everything farmers are told to do about them.
// The model picks problem ids from this list; steps, fertilizer and checks always come from here.
// DRAFT: written from TNAU Agritech guidance; an agronomist has not reviewed it yet.
// `look` is read by the model only. Fertilizer amounts appear only for nutrient shortages, as
// TNAU publishes them; per-acre figures are converted from TNAU's per-hectare ones.

const GUIDANCE_VERSION = '2026-11-23-draft';

const CROPS = ['tomato', 'paddy'];
const PHOTO_SLOTS = ['field', 'wholePlant', 'closeUp', 'underside', 'healthy', 'extra'];
const ANSWERS = {
    stage: {
        tomato: ['seedling', 'vegetative', 'flowering', 'fruiting', 'notSure'],
        paddy: ['nursery', 'tillering', 'flowering', 'grainFilling', 'notSure']
    },
    parts: {
        tomato: ['leaves', 'stem', 'flowers', 'fruit', 'roots'],
        paddy: ['leaves', 'stem', 'panicle', 'roots']
    },
    onset: ['days', 'weeks', 'longer', 'none', 'notSure'],
    extent: ['onePlant', 'scattered', 'largeArea', 'notSure'],
    spreading: ['yes', 'no', 'notSure'],
    weather: ['heavyRain', 'dry', 'normal', 'notSure'],
    treatment: ['none', 'fertilizer', 'pesticide', 'both', 'notSure'],
    treatmentWhen: ['week', 'month', 'notSure']
};

const SOURCES = {
    tomatoNitrogen: ['TNAU Agritech: tomato, nitrogen', 'https://www.agritech.tnau.ac.in/horticulture/plant_nutri/tomato_nitro.html'],
    tomatoPotassium: ['TNAU Agritech: tomato, potassium', 'https://agritech.tnau.ac.in/horticulture/plant_nutri/tomato_pota.html'],
    tomatoMagnesium: ['TNAU Agritech: tomato, magnesium', 'https://www.agritech.tnau.ac.in/horticulture/plant_nutri/tomato_magnes.html'],
    tomatoCalcium: ['TNAU Agritech: tomato, calcium', 'https://www.agritech.tnau.ac.in/horticulture/plant_nutri/tomato_cal.html'],
    nutritionFaq: ['TNAU Agritech: mineral nutrition questions', 'https://agritech.tnau.ac.in/agriculture/agri_min_nutri_faqs.html'],
    vegIpm: ['IPM schedule for vegetables (TNAU Agritech)', 'https://agritech.tnau.ac.in/horticulture/pdf/tech_bulletin/national/IPM-Schedule-for-vegetables.pdf'],
    hortiDiseases: ['TNAU Agritech: disease management of horticultural crops', 'https://agritech.tnau.ac.in/org_farm/orgfarm_hortidiseases.html'],
    vegFaq: ['TNAU Agritech: vegetable questions', 'https://agritech.tnau.ac.in/horticulture/horti_FAQs_Vegetables.html'],
    riceZinc: ['TNAU Agritech: rice, zinc', 'https://agritech.tnau.ac.in/agriculture/plant_nutri/rice_zin.html'],
    ricePotassium: ['TNAU Agritech: rice, potassium', 'https://www.agritech.tnau.ac.in/agriculture/plant_nutri/rice_potassium.html'],
    riceNutrients: ['TNAU Expert System: paddy nutrient management', 'https://www.agritech.tnau.ac.in/expert_system/paddy/nutrientmanagement.html'],
    riceDeficiency: ['TNAU Agritech: rice nutrient deficiencies', 'https://www.agritech.tnau.ac.in/agriculture/agri_cropproduction_cereals_rice_tranpudlow_mainfield_nutrient_mgmt_deficiency.html'],
    riceLcc: ['TNAU Agritech: rice nitrogen by leaf colour chart', 'https://agritech.tnau.ac.in/agriculture/agri_Nutrient_mainfeild_%20Nitrogen_LCC_Rice.html'],
    riceDiseases: ['TNAU: management of diseases of crops of Tamil Nadu', 'https://agritech.tnau.ac.in/pdf/8.pdf'],
    riceBrownSpot: ['TNAU Agritech: rice brown spot', 'https://agritech.tnau.ac.in/crop_protection/rice_diseases/rice_2.html'],
    riceSheathBlight: ['TNAU Agritech: rice sheath blight', 'https://agritech.tnau.ac.in/crop_protection/rice_diseases/rice_6.html'],
    riceFaq: ['TNAU Expert System: paddy questions', 'https://agritech.tnau.ac.in/expert_system/paddy/faqs.html'],
    ricePests: ['TNAU Agritech: pest management of rice', 'https://www.agritech.tnau.ac.in/org_farm/orgfarm_agripest.html'],
    cpps: ['TNAU Centre for Plant Protection Studies: technologies', 'https://tnau.ac.in/site/cpps/technologiesdeveloped/']
};

const NO_CURE = {
    en: "Fertilizer won't cure this. Keep to your usual fertilizer schedule.",
    ta: 'உரம் இதைக் குணப்படுத்தாது. வழக்கமான உர அட்டவணையையே பின்பற்றுங்கள்.'
};

const PROBLEMS = {
    tomato: [
        {
            id: 'earlyBlight',
            kind: 'disease',
            look: 'Brown or black spots with rings inside like a target, on older lower leaves first, often with yellow around them; can also mark stems and fruit near the stalk.',
            name: { en: 'Early blight (spots with rings)', ta: 'முன் இலைக் கருகல் நோய் (வளையப் புள்ளிகள்)' },
            steps: {
                en: [
                    "Pick off the spotted lower leaves and destroy them away from the field. Don't leave them on the ground.",
                    'Water at the base of the plants, not over the leaves, so the leaves stay dry.',
                    "Next season, don't plant tomato, brinjal or chilli here; grow a different crop first."
                ],
                ta: [
                    'புள்ளிகள் உள்ள கீழ் இலைகளைப் பறித்து, வயலுக்கு வெளியே அழித்துவிடுங்கள். தரையில் போட வேண்டாம்.',
                    'இலைகளின் மேல் அல்லாமல் செடியின் அடியில் தண்ணீர் விடுங்கள்; இலைகள் உலர்வாக இருக்கட்டும்.',
                    'அடுத்த பருவத்தில் இங்கு தக்காளி, கத்தரி, மிளகாய் வேண்டாம்; முதலில் வேறு பயிர் போடுங்கள்.'
                ]
            },
            fertilizer: NO_CURE,
            check: {
                en: 'Look at the lower leaves: rings inside the spots, like a target, point to early blight.',
                ta: 'கீழ் இலைகளைப் பாருங்கள்: புள்ளிகளுக்குள் இலக்கு போல வளையங்கள் இருந்தால் இது முன் இலைக் கருகலாக இருக்கலாம்.'
            },
            sources: ['vegIpm', 'hortiDiseases']
        },
        {
            id: 'lateBlight',
            kind: 'disease',
            urgent: true,
            look: 'Large pale-green to dark-brown water-soaked patches on leaves and stems that grow fast; white downy mould under the leaves in cool, damp weather; greasy brown patches on fruit.',
            name: { en: 'Late blight', ta: 'பின் இலைக் கருகல் நோய்' },
            steps: {
                en: [
                    'Remove affected leaves, stems and fruit the same day and destroy them away from the field.',
                    'Stake the plants so air moves between them and the leaves dry faster.',
                    'It spreads very fast in cool, cloudy, wet weather: get expert advice today.'
                ],
                ta: [
                    'பாதிக்கப்பட்ட இலைகள், தண்டுகள், காய்களை அன்றே அகற்றி, வயலுக்கு வெளியே அழித்துவிடுங்கள்.',
                    'செடிகளுக்கு இடையே காற்று போய் இலைகள் சீக்கிரம் உலர, செடிகளுக்குக் குச்சி கட்டுங்கள்.',
                    'குளிர்ந்த, மேகமூட்டமான, ஈரமான காலநிலையில் இது மிக வேகமாகப் பரவும்: இன்றே நிபுணர் ஆலோசனை பெறுங்கள்.'
                ]
            },
            fertilizer: NO_CURE,
            check: {
                en: 'Look under the leaves early in the morning: white, downy mould at the edge of the patches points to late blight.',
                ta: 'அதிகாலையில் இலைகளின் அடிப்பக்கத்தைப் பாருங்கள்: திட்டுகளின் ஓரத்தில் வெள்ளை, பஞ்சு போன்ற பூஞ்சை இருந்தால் இது பின் இலைக் கருகலாக இருக்கலாம்.'
            },
            sources: ['vegIpm']
        },
        {
            id: 'leafCurl',
            kind: 'disease',
            urgent: true,
            look: 'Young leaves small, curled, crinkled or twisted, often yellowish; plant stunted and bushy with short gaps between leaves; few flowers; tiny whiteflies under the leaves.',
            name: { en: 'Leaf curl virus (spread by whiteflies)', ta: 'இலைச் சுருள் நோய் (வெள்ளை ஈ மூலம் பரவும் நச்சுயிரி)' },
            steps: {
                en: [
                    "Pull out plants with curled leaves as soon as you see them and destroy them; they won't recover.",
                    'Hang yellow sticky traps at plant height to catch whiteflies and see how many there are.',
                    'Keep the field and bunds free of weeds, which carry the virus and the whiteflies.',
                    'Next time, raise seedlings under insect-proof net.'
                ],
                ta: [
                    'சுருண்ட இலைகள் உள்ள செடிகளைக் கண்டவுடன் பிடுங்கி அழித்துவிடுங்கள்; அவை மீண்டும் சரியாகாது.',
                    'வெள்ளை ஈக்களைப் பிடிக்கவும், அவை எவ்வளவு உள்ளன என்று அறியவும், செடி உயரத்தில் மஞ்சள் ஒட்டும் பொறிகளைத் தொங்கவிடுங்கள்.',
                    'நச்சுயிரியையும் வெள்ளை ஈக்களையும் சுமக்கும் களைகளை வயலிலும் வரப்பிலும் அகற்றுங்கள்.',
                    'அடுத்த முறை, நாற்றுகளைப் பூச்சி புகாத வலைக்குள் வளர்த்தெடுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Fertilizer won't cure this: the virus stays in the plant.",
                ta: 'உரம் இதைக் குணப்படுத்தாது: நச்சுயிரி செடியிலேயே இருக்கும்.'
            },
            check: {
                en: 'Shake a plant gently: tiny white flies flying up from under the leaves are the whiteflies that spread this virus.',
                ta: 'செடியை மெதுவாக அசையுங்கள்: இலைகளின் அடியிலிருந்து சிறிய வெள்ளை ஈக்கள் பறந்தால், அவையே இந்த நச்சுயிரியைப் பரப்புகின்றன.'
            },
            sources: ['vegIpm', 'hortiDiseases']
        },
        {
            id: 'wilt',
            kind: 'disease',
            urgent: true,
            look: 'Whole plant droops or wilts even though the soil is moist, at first recovering at night; lower leaves may yellow first; brown streaks inside the stem when cut.',
            name: { en: 'Wilt (bacterial or fusarium)', ta: 'வாடல் நோய் (பாக்டீரியா அல்லது பூஞ்சை)' },
            steps: {
                en: [
                    "Pull out wilted plants with their roots and destroy them away from the field. Don't put them in compost.",
                    "Don't let water from this patch run to healthy plants, and clean your tools after working here.",
                    'Next season, grow a cereal such as maize or ragi here before planting tomato again.'
                ],
                ta: [
                    'வாடிய செடிகளை வேருடன் பிடுங்கி, வயலுக்கு வெளியே அழித்துவிடுங்கள். உரக்குழியில் போட வேண்டாம்.',
                    'இந்தப் பகுதியிலிருந்து தண்ணீர் நல்ல செடிகளுக்குப் பாய விட வேண்டாம்; இங்கு வேலை செய்த பின் கருவிகளைச் சுத்தம் செய்யுங்கள்.',
                    'அடுத்த பருவத்தில், மீண்டும் தக்காளி போடும் முன் இங்கு மக்காச்சோளம் அல்லது கேழ்வரகு போன்ற தானியப் பயிர் போடுங்கள்.'
                ]
            },
            fertilizer: NO_CURE,
            check: {
                en: 'Cut a wilted stem near the ground and stand the cut end in a glass of clear water: milky threads flowing out point to bacterial wilt.',
                ta: 'வாடிய தண்டைத் தரை அருகே வெட்டி, வெட்டிய முனையைத் தெளிந்த நீருள்ள டம்ளரில் வையுங்கள்: பால் போன்ற இழைகள் வெளியே வந்தால் இது பாக்டீரியா வாடல் நோய்.'
            },
            sources: ['hortiDiseases']
        },
        {
            id: 'fruitBorer',
            kind: 'pest',
            look: 'Round holes in green or ripe fruit, often with droppings at the hole; green or brown striped caterpillars on fruit or leaves.',
            name: { en: 'Fruit borer (caterpillar)', ta: 'காய்ப்புழு (காய் துளைப்பான்)' },
            steps: {
                en: [
                    'Every few days, pick bored fruit and caterpillars and destroy them away from the field.',
                    'Set up fruit borer pheromone traps to catch the moths: TNAU advises 12 per hectare, about 5 per acre.',
                    'Next planting, grow one row of tall marigold for every 16 rows of tomato; the moths lay eggs on the marigold instead.'
                ],
                ta: [
                    'சில நாட்களுக்கு ஒருமுறை, துளையிட்ட காய்களையும் புழுக்களையும் பறித்து, வயலுக்கு வெளியே அழித்துவிடுங்கள்.',
                    'அந்துப்பூச்சிகளைப் பிடிக்க காய்ப்புழு இனக்கவர்ச்சிப் பொறிகளை வையுங்கள்: TNAU பரிந்துரை ஹெக்டேருக்கு 12, அதாவது ஏக்கருக்கு சுமார் 5.',
                    'அடுத்த நடவில், ஒவ்வொரு 16 வரிசை தக்காளிக்கும் ஒரு வரிசை உயரமான செண்டுமல்லி நடுங்கள்; அந்துப்பூச்சிகள் செண்டுமல்லியில் முட்டையிடும்.'
                ]
            },
            fertilizer: NO_CURE,
            check: {
                en: 'Cut open a damaged fruit: a caterpillar or its droppings inside points to fruit borer.',
                ta: 'சேதமான காயை வெட்டிப் பாருங்கள்: உள்ளே புழு அல்லது அதன் கழிவு இருந்தால் இது காய்ப்புழு.'
            },
            sources: ['vegFaq', 'vegIpm']
        },
        {
            id: 'leafMiner',
            kind: 'pest',
            look: 'Winding white or silvery lines (tunnels) inside the leaves, or papery blotches; a tiny larva may show at the end of a tunnel.',
            name: { en: 'Leaf miner', ta: 'இலைச் சுரங்க ஈ' },
            steps: {
                en: [
                    'Pick leaves with tunnels and destroy them, especially in the first weeks after planting.',
                    'At planting, TNAU advises mixing neem cake into the furrows, 250 kg per hectare (about 100 kg per acre), and again 25 days later.'
                ],
                ta: [
                    'சுரங்கக் கோடுகள் உள்ள இலைகளை, குறிப்பாக நட்ட முதல் வாரங்களில், பறித்து அழித்துவிடுங்கள்.',
                    'நடவின்போது, ஹெக்டேருக்கு 250 கிலோ (ஏக்கருக்கு சுமார் 100 கிலோ) வேப்பம் புண்ணாக்கைச் சால்களில் இட்டு, 25 நாள் கழித்து மீண்டும் இட TNAU பரிந்துரைக்கிறது.'
                ]
            },
            fertilizer: NO_CURE,
            check: {
                en: 'Hold a leaf up to the light: winding tunnels with a tiny larva at one end point to leaf miner.',
                ta: 'இலையை வெளிச்சத்திற்கு நேராகப் பிடித்துப் பாருங்கள்: ஒரு முனையில் சிறு புழுவுடன் வளைந்த சுரங்கங்கள் இருந்தால் இது இலைச் சுரங்க ஈ.'
            },
            sources: ['vegIpm']
        },
        {
            id: 'blossomEndRot',
            kind: 'nutrient',
            look: 'Dark, sunken, leathery patch at the bottom end of the fruit, opposite the stalk, often on the first fruits; leaves may look normal.',
            name: { en: 'Blossom-end rot (calcium shortage in the fruit)', ta: 'பூ முனை அழுகல் (காயில் சுண்ணாம்புச்சத்துக் குறைபாடு)' },
            steps: {
                en: [
                    "Keep the soil evenly moist: water regularly, and don't let it dry out and then flood it.",
                    'In dry weather, mulch around the plants to hold the moisture.',
                    "Pick off affected fruit; they won't recover."
                ],
                ta: [
                    'மண் ஈரத்தைச் சீராக வையுங்கள்: தவறாமல் தண்ணீர் விடுங்கள்; மண் காய்ந்த பின் திடீரென அதிக நீர் பாய்ச்ச வேண்டாம்.',
                    'வறண்ட காலத்தில், ஈரம் தங்க செடிகளைச் சுற்றி மூடாக்கு இடுங்கள்.',
                    'பாதிக்கப்பட்ட காய்களைப் பறித்துவிடுங்கள்; அவை சரியாகாது.'
                ]
            },
            fertilizer: {
                en: "TNAU advises spraying calcium chloride at 0.5% (5 g in 1 litre of water) three times, 15 days apart. Don't give extra nitrogen (urea).",
                ta: 'TNAU பரிந்துரை: கால்சியம் குளோரைடு 0.5% (1 லிட்டர் தண்ணீரில் 5 கிராம்) கரைசலை 15 நாள் இடைவெளியில் மூன்று முறை தெளிக்கவும். கூடுதல் தழைச்சத்து (யூரியா) இட வேண்டாம்.'
            },
            check: {
                en: 'Look at the bottom of the fruits: a dark sunken patch there, with no hole or mould, points to blossom-end rot.',
                ta: 'காய்களின் அடிப்பகுதியைப் பாருங்கள்: துளையோ பூஞ்சையோ இல்லாமல் கருமையான குழிந்த திட்டு இருந்தால் இது பூ முனை அழுகல்.'
            },
            sources: ['tomatoCalcium', 'nutritionFaq']
        },
        {
            id: 'nitrogenShortage',
            kind: 'nutrient',
            look: 'Older lower leaves turn evenly pale green to yellow first while young leaves stay greener; plant thin and slow-growing with small leaves; flower buds may drop.',
            name: { en: 'Nitrogen shortage', ta: 'தழைச்சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'Check that the yellowing starts on the oldest, lowest leaves and is even, with no spots.',
                    "If the field is waterlogged, drain it first: roots in soggy soil can't take up nitrogen."
                ],
                ta: [
                    'மஞ்சள் நிறம் பழைய, கீழ் இலைகளில் தொடங்கி, புள்ளிகள் இல்லாமல் சீராக இருக்கிறதா என்று பாருங்கள்.',
                    'வயலில் தண்ணீர் தேங்கியிருந்தால் முதலில் வடியுங்கள்: சேறான மண்ணில் வேர்கள் தழைச்சத்தை எடுக்க முடியாது.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises spraying urea at 1% (10 g in 1 litre of water) twice, a week apart. For the main fertilizer doses, follow a soil test.',
                ta: 'TNAU பரிந்துரை: யூரியா 1% (1 லிட்டர் தண்ணீரில் 10 கிராம்) கரைசலை ஒரு வார இடைவெளியில் இரண்டு முறை தெளிக்கவும். முக்கிய உர அளவுகளுக்கு மண் பரிசோதனையைப் பின்பற்றுங்கள்.'
            },
            check: {
                en: 'Compare old and young leaves on the same plant: if only the old ones are yellow, it fits nitrogen shortage.',
                ta: 'ஒரே செடியில் பழைய, இளம் இலைகளை ஒப்பிடுங்கள்: பழைய இலைகள் மட்டும் மஞ்சளாக இருந்தால் தழைச்சத்துக் குறைபாடு பொருந்தும்.'
            },
            sources: ['tomatoNitrogen']
        },
        {
            id: 'potassiumShortage',
            kind: 'nutrient',
            look: 'Older leaves yellow and then brown and scorched along the edges and tips, edges may curl up; plant stunted; fruit ripen unevenly.',
            name: { en: 'Potash (potassium) shortage', ta: 'சாம்பல்சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'Check that the scorching starts at the edges of the older leaves.',
                    'Before the next crop, get a soil test so the potash dose suits your soil.'
                ],
                ta: [
                    'கருகல் பழைய இலைகளின் ஓரங்களில் தொடங்குகிறதா என்று பாருங்கள்.',
                    'அடுத்த பயிருக்கு முன் மண் பரிசோதனை செய்யுங்கள்; அப்போது சாம்பல்சத்து அளவு உங்கள் மண்ணுக்குப் பொருந்தும்.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises spraying potassium sulphate at 1% (10 g in 1 litre of water) three times, a week apart.',
                ta: 'TNAU பரிந்துரை: பொட்டாசியம் சல்பேட் 1% (1 லிட்டர் தண்ணீரில் 10 கிராம்) கரைசலை ஒரு வார இடைவெளியில் மூன்று முறை தெளிக்கவும்.'
            },
            check: {
                en: 'Look at the oldest leaves: dry yellow-brown edges while the middle stays green fit potash shortage.',
                ta: 'பழைய இலைகளைப் பாருங்கள்: நடுப்பகுதி பச்சையாக இருக்க, ஓரங்கள் மஞ்சள்-பழுப்பாகக் காய்ந்திருந்தால் சாம்பல்சத்துக் குறைபாடு பொருந்தும்.'
            },
            sources: ['tomatoPotassium']
        },
        {
            id: 'magnesiumShortage',
            kind: 'nutrient',
            look: 'Older leaves yellow between the veins while the veins stay green, starting with the lower leaves and moving up; later brown dead patches.',
            name: { en: 'Magnesium shortage', ta: 'மெக்னீசியம் சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'Check that the yellowing is between the veins of the older leaves, with the veins still green.',
                    'Before the next crop, get a soil test.'
                ],
                ta: [
                    'பழைய இலைகளில் நரம்புகள் பச்சையாக இருக்க, இடைப்பகுதி மட்டும் மஞ்சளாக இருக்கிறதா என்று பாருங்கள்.',
                    'அடுத்த பயிருக்கு முன் மண் பரிசோதனை செய்யுங்கள்.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises spraying magnesium sulphate at 2% (20 g in 1 litre of water) twice, 15 days apart, or applying magnesium sulphate to the soil at 20 kg per hectare (about 8 kg per acre).',
                ta: 'TNAU பரிந்துரை: மெக்னீசியம் சல்பேட் 2% (1 லிட்டர் தண்ணீரில் 20 கிராம்) கரைசலை 15 நாள் இடைவெளியில் இரண்டு முறை தெளிக்கவும், அல்லது ஹெக்டேருக்கு 20 கிலோ (ஏக்கருக்கு சுமார் 8 கிலோ) மெக்னீசியம் சல்பேட்டை மண்ணில் இடவும்.'
            },
            check: {
                en: 'Hold an older leaf up to the light: green veins with yellow between them fit magnesium shortage.',
                ta: 'பழைய இலையை வெளிச்சத்தில் பாருங்கள்: நரம்புகள் பச்சையாகவும் இடைப்பகுதி மஞ்சளாகவும் இருந்தால் மெக்னீசியம் குறைபாடு பொருந்தும்.'
            },
            sources: ['tomatoMagnesium']
        },
        {
            id: 'waterStress',
            kind: 'water',
            look: 'Leaves droop or roll in the heat of the day and recover in the evening, with dry soil; or yellowing, drooping plants standing in waterlogged soil.',
            name: { en: 'Too little or too much water', ta: 'தண்ணீர் குறைவு அல்லது அதிகம்' },
            steps: {
                en: [
                    "Feel the soil 5 to 10 cm down: if it's dry, water regularly; if it's soggy, drain the field.",
                    'In dry weather, mulch around the plants to keep the moisture even.'
                ],
                ta: [
                    '5 முதல் 10 செ.மீ. ஆழத்தில் மண்ணைத் தொட்டுப் பாருங்கள்: காய்ந்திருந்தால் தவறாமல் தண்ணீர் விடுங்கள்; சேறாக இருந்தால் வயலை வடியுங்கள்.',
                    'வறண்ட காலத்தில், ஈரம் சீராக இருக்க செடிகளைச் சுற்றி மூடாக்கு இடுங்கள்.'
                ]
            },
            fertilizer: {
                en: 'Sort out the water first. Fertilizer on a stressed crop can make it worse.',
                ta: 'முதலில் தண்ணீர் பிரச்சினையைச் சரிசெய்யுங்கள். பாதிக்கப்பட்ட பயிருக்கு உரம் இட்டால் நிலைமை மோசமாகலாம்.'
            },
            check: {
                en: 'Look at the plants again in the evening: if they perk up once it is cooler, heat and dry soil are the likely cause.',
                ta: 'மாலையில் செடிகளை மீண்டும் பாருங்கள்: வெயில் குறைந்ததும் நிமிர்ந்தால், வெப்பமும் காய்ந்த மண்ணுமே காரணமாக இருக்கலாம்.'
            },
            sources: ['nutritionFaq']
        }
    ],

    paddy: [
        {
            id: 'blast',
            kind: 'disease',
            urgent: true,
            look: 'Spindle or eye-shaped spots with grey or white centres and brown edges on the leaves; black patches on the nodes; at heading, the neck below the panicle turns black and breaks and the grains stay empty.',
            name: { en: 'Blast', ta: 'குலை நோய்' },
            steps: {
                en: [
                    'Remove grassy weeds from bunds and channels; they carry the disease.',
                    'Blast spreads fastest in cloudy, drizzly weather with heavy dew: watch the crop closely.',
                    'If the neck of the panicle or the nodes are turning black, get expert advice today.'
                ],
                ta: [
                    'வரப்புகளிலும் வாய்க்கால்களிலும் உள்ள புல் வகைக் களைகளை அகற்றுங்கள்; அவை நோயைச் சுமக்கும்.',
                    'மேகமூட்டம், தூறல், அதிகப் பனி உள்ள காலத்தில் குலை நோய் வேகமாகப் பரவும்: பயிரைக் கவனமாகப் பாருங்கள்.',
                    'கதிர்க் கழுத்து அல்லது கணுக்கள் கருப்பாக மாறினால், இன்றே நிபுணர் ஆலோசனை பெறுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Don't add extra urea now: too much nitrogen makes blast worse. TNAU advises giving nitrogen in three parts: half at planting, a quarter at tillering and a quarter at panicle initiation.",
                ta: 'இப்போது கூடுதல் யூரியா இட வேண்டாம்: அதிகத் தழைச்சத்து குலை நோயை அதிகப்படுத்தும். TNAU பரிந்துரை: தழைச்சத்தை மூன்று பகுதிகளாக இடவும்; பாதி அடியுரமாக, கால் பங்கு தூர் கட்டும்போது, கால் பங்கு கதிர் உருவாகும்போது.'
            },
            check: {
                en: 'Look closely at the spots: pointed ends with a grey centre and brown edge point to blast; small round brown spots fit brown spot instead.',
                ta: 'புள்ளிகளை அருகில் பாருங்கள்: கூர்மையான முனைகள், சாம்பல் நிற நடு, பழுப்பு ஓரம் இருந்தால் குலை நோய்; சிறிய வட்டமான பழுப்புப் புள்ளிகள் என்றால் பழுப்புப் புள்ளி நோய்.'
            },
            sources: ['riceDiseases']
        },
        {
            id: 'brownSpot',
            kind: 'disease',
            look: 'Many small round or oval dark-brown spots with a yellow halo scattered over the leaves; dark spots on the grains; seedlings may look scorched.',
            name: { en: 'Brown spot', ta: 'பழுப்புப் புள்ளி நோய்' },
            steps: {
                en: [
                    'Brown spot is common where the soil is short of nutrients: get a soil test (Soil Health Card) from your agriculture office.',
                    'For the next crop, take seed from a healthy field.'
                ],
                ta: [
                    'மண்ணில் சத்துக் குறைவாக உள்ள இடங்களில் பழுப்புப் புள்ளி நோய் அதிகம் வரும்: வேளாண் அலுவலகத்தில் மண் பரிசோதனை (மண் வள அட்டை) செய்யுங்கள்.',
                    'அடுத்த பயிருக்கு, நோயில்லாத வயலிலிருந்து விதை எடுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Apply the fertilizer your soil test recommends. Fertilizer won't clear the spots already there.",
                ta: 'மண் பரிசோதனை பரிந்துரைக்கும் உரத்தை இடுங்கள். ஏற்கெனவே உள்ள புள்ளிகள் உரத்தால் மறையாது.'
            },
            check: {
                en: 'Look at the spots: small round or oval brown spots with a yellow ring, spread over the whole leaf, fit brown spot.',
                ta: 'புள்ளிகளைப் பாருங்கள்: மஞ்சள் வளையத்துடன் சிறிய வட்டமான அல்லது நீள்வட்டப் பழுப்புப் புள்ளிகள் இலை முழுவதும் இருந்தால் பழுப்புப் புள்ளி நோய் பொருந்தும்.'
            },
            sources: ['riceBrownSpot']
        },
        {
            id: 'bacterialBlight',
            kind: 'disease',
            urgent: true,
            look: 'Leaves turn yellow, then straw-coloured, from the tip down along one or both edges with a wavy border; yellowish drops may show in the morning; young plants may wilt.',
            name: { en: 'Bacterial leaf blight', ta: 'பாக்டீரியா இலைக் கருகல் நோய்' },
            steps: {
                en: [
                    "Don't keep deep standing water, and drain the field if it floods.",
                    "Don't let water from this field flow into healthy fields.",
                    'Remove weeds and old stubble, which carry the bacteria.'
                ],
                ta: [
                    'வயலில் ஆழமாகத் தண்ணீர் தேங்க விட வேண்டாம்; வெள்ளம் வந்தால் வடியுங்கள்.',
                    'இந்த வயலின் தண்ணீர் நல்ல வயல்களுக்குப் பாய விட வேண்டாம்.',
                    'பாக்டீரியாவைச் சுமக்கும் களைகளையும் பழைய தாள்களையும் அகற்றுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Don't top-dress urea now: heavy or late nitrogen makes this worse. Give nitrogen in split doses, as TNAU advises.",
                ta: 'இப்போது மேலுரமாக யூரியா இட வேண்டாம்: அதிகமான அல்லது தாமதமான தழைச்சத்து இதை அதிகப்படுத்தும். TNAU பரிந்துரைப்படி தழைச்சத்தைப் பிரித்து இடுங்கள்.'
            },
            check: {
                en: 'Cut a diseased leaf and dip the cut end in a glass of clear water: milky ooze coming out points to bacterial leaf blight.',
                ta: 'நோயுற்ற இலையை வெட்டி, வெட்டிய முனையைத் தெளிந்த நீருள்ள டம்ளரில் வையுங்கள்: பால் போன்ற திரவம் வெளியே வந்தால் இது பாக்டீரியா இலைக் கருகல்.'
            },
            sources: ['riceDiseases']
        },
        {
            id: 'sheathBlight',
            kind: 'disease',
            look: 'Oval or irregular greenish-grey patches with brown or purple-brown borders on the leaf sheath near the water line, spreading upwards; worse in dense, heavily fertilised crops.',
            name: { en: 'Sheath blight', ta: 'இலை உறை கருகல் நோய்' },
            steps: {
                en: [
                    "Don't let water from this field flow into healthy fields; the fungus travels in the water.",
                    'TNAU advises applying neem cake at 60 kg per acre.',
                    'After harvest, plough deep in summer and clear the stubble.'
                ],
                ta: [
                    'இந்த வயலின் தண்ணீர் நல்ல வயல்களுக்குப் பாய விட வேண்டாம்; பூஞ்சை நீர் வழியே பரவும்.',
                    'TNAU பரிந்துரை: ஏக்கருக்கு 60 கிலோ வேப்பம் புண்ணாக்கு இடவும்.',
                    'அறுவடைக்குப் பின் கோடையில் ஆழமாக உழுது, தாள்களை அகற்றுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Don't add extra nitrogen: heavy nitrogen and close planting make sheath blight worse.",
                ta: 'கூடுதல் தழைச்சத்து இட வேண்டாம்: அதிகத் தழைச்சத்தும் நெருக்கமான நடவும் இலை உறை கருகலை அதிகப்படுத்தும்.'
            },
            check: {
                en: 'Part the plants and look at the stems near the water: grey-green oval patches with brown borders fit sheath blight.',
                ta: 'பயிர்களை விலக்கி, நீர் மட்டத்தருகே தண்டுகளைப் பாருங்கள்: பழுப்பு ஓரத்துடன் சாம்பல்-பச்சை நீள்வட்டத் திட்டுகள் இருந்தால் இலை உறை கருகல் பொருந்தும்.'
            },
            sources: ['riceSheathBlight', 'riceDiseases']
        },
        {
            id: 'stemBorer',
            kind: 'pest',
            look: 'In the young crop the central shoot dries, turns brown and pulls out easily (dead heart); after heading the whole panicle is white and empty (white ear); small holes in the stems.',
            name: { en: 'Stem borer', ta: 'தண்டுத் துளைப்பான்' },
            steps: {
                en: [
                    'Pull out the dried central shoots and destroy them.',
                    'Set up yellow stem borer pheromone traps, 12 per hectare (about 5 per acre), and a light trap for the moths.',
                    'At harvest, cut the crop close to the ground and plough the stubble in.'
                ],
                ta: [
                    'காய்ந்த நடுக்குருத்துகளைப் பிடுங்கி அழித்துவிடுங்கள்.',
                    'மஞ்சள் தண்டுத் துளைப்பானுக்கு ஹெக்டேருக்கு 12 (ஏக்கருக்கு சுமார் 5) இனக்கவர்ச்சிப் பொறிகளும், அந்துப்பூச்சிகளுக்கு விளக்குப் பொறியும் வையுங்கள்.',
                    'அறுவடையின்போது தரையோடு அறுத்து, தாள்களை உழுது புதையுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Don't add extra urea: TNAU warns that heavy nitrogen brings more pests.",
                ta: 'கூடுதல் யூரியா இட வேண்டாம்: அதிகத் தழைச்சத்து பூச்சிகளை அதிகரிக்கும் என்று TNAU எச்சரிக்கிறது.'
            },
            check: {
                en: 'Pull a dried central shoot: if it comes out easily and the base is chewed, it is stem borer.',
                ta: 'காய்ந்த நடுக்குருத்தை இழுத்துப் பாருங்கள்: எளிதாக வந்து, அடிப்பகுதி கடிக்கப்பட்டிருந்தால் இது தண்டுத் துளைப்பான்.'
            },
            sources: ['riceFaq', 'ricePests', 'cpps']
        },
        {
            id: 'leafFolder',
            kind: 'pest',
            look: 'Leaves folded lengthwise into tubes, with white or see-through scraped streaks; a green caterpillar inside the fold.',
            name: { en: 'Leaf folder', ta: 'இலைச் சுருட்டுப் புழு' },
            steps: {
                en: [
                    'Clip off the folded leaves and destroy them.',
                    'Keep the bunds trimmed and free of grassy weeds.',
                    'A light trap at night catches the moths.'
                ],
                ta: [
                    'சுருண்ட இலைகளை வெட்டி அழித்துவிடுங்கள்.',
                    'வரப்புகளைச் செதுக்கி, புல் களைகள் இல்லாமல் வையுங்கள்.',
                    'இரவில் விளக்குப் பொறி அந்துப்பூச்சிகளைப் பிடிக்கும்.'
                ]
            },
            fertilizer: {
                en: "Don't add extra nitrogen: TNAU warns that too much nitrogen increases leaf folder.",
                ta: 'கூடுதல் தழைச்சத்து இட வேண்டாம்: அதிகத் தழைச்சத்து இலைச் சுருட்டுப் புழுவை அதிகரிக்கும் என்று TNAU எச்சரிக்கிறது.'
            },
            check: {
                en: 'Open a folded leaf: a caterpillar inside confirms leaf folder.',
                ta: 'சுருண்ட இலையைத் திறந்து பாருங்கள்: உள்ளே புழு இருந்தால் இது இலைச் சுருட்டுப் புழு.'
            },
            sources: ['riceFaq']
        },
        {
            id: 'planthopper',
            kind: 'pest',
            urgent: true,
            look: 'Round patches of plants turning yellow, then brown and dry as if burnt (hopper burn), often in the middle of the field; many small brown insects at the base of the plants near the water.',
            name: { en: 'Brown planthopper (hopper burn)', ta: 'புகையான் (பழுப்புத் தத்துப்பூச்சி)' },
            steps: {
                en: [
                    'Drain the water from the field for 3 to 4 days.',
                    'When you plant, leave a 30 cm gap every 2.5 m so air and light reach the base of the plants.',
                    'Some sprays, such as synthetic pyrethroids, make planthoppers come back worse: ask an expert before you spray.'
                ],
                ta: [
                    'வயலிலிருந்து 3 முதல் 4 நாட்களுக்குத் தண்ணீரை வடியுங்கள்.',
                    'நடும்போது, ஒவ்வொரு 2.5 மீட்டருக்கும் 30 செ.மீ. இடைவெளி விடுங்கள்; காற்றும் வெளிச்சமும் பயிரின் அடிவரை செல்லும்.',
                    'செயற்கை பைரித்ராய்டு போன்ற சில மருந்துகள் புகையானை மீண்டும் அதிகமாக்கும்: தெளிக்கும் முன் நிபுணரிடம் கேளுங்கள்.'
                ]
            },
            fertilizer: {
                en: "Don't add extra nitrogen: TNAU warns that it increases planthoppers.",
                ta: 'கூடுதல் தழைச்சத்து இட வேண்டாம்: அது புகையானை அதிகரிக்கும் என்று TNAU எச்சரிக்கிறது.'
            },
            check: {
                en: 'Part the plants and tap the base: many small brown insects dropping onto the water point to planthoppers.',
                ta: 'பயிர்களை விலக்கி அடிப்பகுதியைத் தட்டுங்கள்: பல சிறிய பழுப்புப் பூச்சிகள் நீரில் விழுந்தால் இது புகையான்.'
            },
            sources: ['riceFaq', 'ricePests']
        },
        {
            id: 'zincShortage',
            kind: 'nutrient',
            look: 'Dusty brown or rusty spots on the younger leaves, pale leaf bases, stunted uneven growth and few tillers, usually 2 to 4 weeks after transplanting.',
            name: { en: 'Zinc shortage', ta: 'துத்தநாகச் சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'Check that the plants are stunted with rusty brown spots, especially 2 to 4 weeks after transplanting.',
                    'Get a soil test to plan zinc for the next crop.'
                ],
                ta: [
                    'குறிப்பாக நட்ட 2 முதல் 4 வாரங்களில், பயிர் குட்டையாகி துரு போன்ற பழுப்புப் புள்ளிகளுடன் உள்ளதா என்று பாருங்கள்.',
                    'அடுத்த பயிருக்குத் துத்தநாகம் திட்டமிட மண் பரிசோதனை செய்யுங்கள்.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises spraying zinc sulphate at 0.5% (5 g in 1 litre of water) twice, 15 days apart, until the signs go. For the next crop, mix 25 kg zinc sulphate per hectare (about 10 kg per acre) with dry sand and apply it just before transplanting.',
                ta: 'TNAU பரிந்துரை: துத்தநாக சல்பேட் 0.5% (1 லிட்டர் தண்ணீரில் 5 கிராம்) கரைசலை 15 நாள் இடைவெளியில் இரண்டு முறை, அறிகுறிகள் மறையும் வரை தெளிக்கவும். அடுத்த பயிருக்கு, ஹெக்டேருக்கு 25 கிலோ (ஏக்கருக்கு சுமார் 10 கிலோ) துத்தநாக சல்பேட்டை உலர்ந்த மணலுடன் கலந்து நடவுக்கு முன் இடவும்.'
            },
            check: {
                en: 'Look at the young and middle leaves: rusty brown spots with pale leaf bases fit zinc shortage.',
                ta: 'இளம், நடு இலைகளைப் பாருங்கள்: வெளிறிய இலை அடிப்பகுதியுடன் துரு போன்ற பழுப்புப் புள்ளிகள் இருந்தால் துத்தநாகக் குறைபாடு பொருந்தும்.'
            },
            sources: ['riceZinc', 'riceDeficiency']
        },
        {
            id: 'nitrogenShortage',
            kind: 'nutrient',
            look: 'Whole crop pale yellow-green; older lower leaves yellow first, starting at the tip; plants short with few tillers.',
            name: { en: 'Nitrogen shortage', ta: 'தழைச்சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'Check the leaf colour with a leaf colour chart (ask your agriculture office) from 14 days after transplanting: compare the third leaf from the top in 10 places, between 8 and 10 in the morning.'
                ],
                ta: [
                    'நட்ட 14 நாட்களுக்குப் பின், இலை வண்ண அட்டை கொண்டு (வேளாண் அலுவலகத்தில் கேளுங்கள்), காலை 8 முதல் 10 மணிக்குள், 10 இடங்களில் மேலிருந்து மூன்றாவது இலையின் நிறத்தை ஒப்பிடுங்கள்.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises: if 6 of the 10 readings are below 4 (below 3 for White Ponni), apply 30 kg of nitrogen per hectare (about 26 kg urea per acre) for medium and long duration crops, or 40 kg per hectare (about 35 kg urea per acre) for short-duration kuruvai crops.',
                ta: 'TNAU பரிந்துரை: 10 அளவீடுகளில் 6, அட்டையின் 4-க்குக் கீழ் இருந்தால் (வெள்ளைப் பொன்னிக்கு 3-க்குக் கீழ்), மத்திய, நீண்ட கால ரகங்களுக்கு ஹெக்டேருக்கு 30 கிலோ தழைச்சத்து (ஏக்கருக்கு சுமார் 26 கிலோ யூரியா), குறுவை போன்ற குறுகிய கால ரகங்களுக்கு ஹெக்டேருக்கு 40 கிலோ (ஏக்கருக்கு சுமார் 35 கிலோ யூரியா) இடவும்.'
            },
            check: {
                en: 'Compare with a healthy field nearby: if your whole crop is paler and the oldest leaves yellow first, it fits nitrogen shortage.',
                ta: 'அருகிலுள்ள நல்ல வயலுடன் ஒப்பிடுங்கள்: உங்கள் பயிர் முழுவதும் வெளிறி, பழைய இலைகள் முதலில் மஞ்சளானால் தழைச்சத்துக் குறைபாடு பொருந்தும்.'
            },
            sources: ['riceLcc', 'riceDeficiency']
        },
        {
            id: 'potassiumShortage',
            kind: 'nutrient',
            look: 'Older leaves with yellow-brown, scorched tips and edges; rusty brown spots on leaves and panicles; dark green upper leaves; weak stems that fall over.',
            name: { en: 'Potash (potassium) shortage', ta: 'சாம்பல்சத்துக் குறைபாடு' },
            steps: {
                en: [
                    'After harvest, spread the straw evenly over the field and work it in, rather than taking it away; it returns potash to the soil.',
                    'Get a soil test to plan potash for the next crop.'
                ],
                ta: [
                    'அறுவடைக்குப் பின், வைக்கோலை எடுத்துச் செல்லாமல் வயல் முழுவதும் சீராகப் பரப்பி மண்ணில் கலக்குங்கள்; அது சாம்பல்சத்தை மண்ணுக்குத் திருப்பித் தரும்.',
                    'அடுத்த பயிருக்குச் சாம்பல்சத்து திட்டமிட மண் பரிசோதனை செய்யுங்கள்.'
                ]
            },
            fertilizer: {
                en: 'TNAU advises spraying potassium chloride (muriate of potash) or potassium sulphate at 1% (10 g in 1 litre of water) every 15 days until the signs go.',
                ta: 'TNAU பரிந்துரை: பொட்டாசியம் குளோரைடு (மியூரேட் ஆஃப் பொட்டாஷ்) அல்லது பொட்டாசியம் சல்பேட் 1% (1 லிட்டர் தண்ணீரில் 10 கிராம்) கரைசலை, அறிகுறிகள் மறையும் வரை 15 நாளுக்கு ஒருமுறை தெளிக்கவும்.'
            },
            check: {
                en: 'Look at the oldest leaves: dry yellow-brown tips and edges fit potash shortage.',
                ta: 'பழைய இலைகளைப் பாருங்கள்: நுனியும் ஓரங்களும் மஞ்சள்-பழுப்பாகக் காய்ந்திருந்தால் சாம்பல்சத்துக் குறைபாடு பொருந்தும்.'
            },
            sources: ['ricePotassium', 'riceNutrients']
        }
    ]
};

const problemsFor = crop => PROBLEMS[crop] || [];
const findProblem = (crop, id) => problemsFor(crop).find(p => p.id === id);

// What a result carries for one cause: everything the farmer reads, in both languages.
const guidanceFor = (crop, id) => {
    const p = findProblem(crop, id);
    if (!p) return null;
    return {
        id: p.id,
        kind: p.kind,
        urgent: !!p.urgent,
        name: p.name,
        steps: p.steps,
        fertilizer: p.fertilizer,
        check: p.check,
        sources: p.sources.map(key => ({ title: SOURCES[key][0], url: SOURCES[key][1] }))
    };
};

module.exports = { GUIDANCE_VERSION, CROPS, PHOTO_SLOTS, ANSWERS, SOURCES, PROBLEMS, problemsFor, findProblem, guidanceFor };
