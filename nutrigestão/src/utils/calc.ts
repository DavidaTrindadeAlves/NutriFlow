import {
  AssessmentCalculationInput,
  AssessmentCalculationResult,
  AssessmentProtocol,
  SkinfoldType,
} from '../types.ts';

export function calculateBmi(weightKg: number, heightCm: number): { bmi: number; classification: string } {
  if (weightKg <= 0 || heightCm <= 0) {
    return { bmi: 0, classification: 'Não informado' };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(2));

  let classification = 'Eutrofia (Peso normal)';
  if (bmi < 18.5) {
    classification = 'Baixo peso';
  } else if (bmi < 25) {
    classification = 'Eutrofia (Peso normal)';
  } else if (bmi < 30) {
    classification = 'Sobrepeso';
  } else if (bmi < 35) {
    classification = 'Obesidade Grau I';
  } else if (bmi < 40) {
    classification = 'Obesidade Grau II';
  } else {
    classification = 'Obesidade Grau III (Mórbida)';
  }

  return { bmi, classification };
}

export function siriFormula(density: number): number {
  if (density <= 0) return 0;
  const fat = (4.95 / density - 4.5) * 100;
  return Math.min(Math.max(Number(fat.toFixed(2)), 3.0), 65.0);
}

export function calculateComposition(input: AssessmentCalculationInput): AssessmentCalculationResult {
  const { gender, age, weight, height, protocol, skinfolds } = input;
  const { bmi, classification: bmiClassification } = calculateBmi(weight, height);

  const get = (type: SkinfoldType): number => skinfolds[type] || 0;

  let skinfoldsSum = 0;
  let bodyDensity: number | undefined;
  let bodyFatPercentage = 0;

  const validAge = Math.max(age || 25, 10);

  if (protocol === 'Pollock 7 Dobras' || protocol === 'pollock_7') {
    // Jackson & Pollock 7: Peitoral, Axilar Média, Tríceps, Subescapular, Abdominal, Supra-ilíaca, Coxa
    skinfoldsSum =
      get('chest') +
      get('midaxillary') +
      get('triceps') +
      get('subscapular') +
      get('abdominal') +
      get('suprailiac') +
      get('thigh');

    if (skinfoldsSum > 0) {
      if (gender === 'M') {
        bodyDensity =
          1.112 -
          0.00043499 * skinfoldsSum +
          0.00000055 * Math.pow(skinfoldsSum, 2) -
          0.00028826 * validAge;
      } else {
        bodyDensity =
          1.097 -
          0.00046971 * skinfoldsSum +
          0.00000056 * Math.pow(skinfoldsSum, 2) -
          0.00012828 * validAge;
      }
      bodyFatPercentage = siriFormula(bodyDensity);
    }
  } else if (protocol === 'Pollock 3 Dobras' || protocol === 'pollock_3') {
    // Pollock 3: Homens = Peitoral, Abdômen, Coxa; Mulheres = Tríceps, Supra-ilíaca, Coxa
    if (gender === 'M') {
      skinfoldsSum = get('chest') + get('abdominal') + get('thigh');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.10938 -
          0.0008267 * skinfoldsSum +
          0.0000016 * Math.pow(skinfoldsSum, 2) -
          0.0002574 * validAge;
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    } else {
      skinfoldsSum = get('triceps') + get('suprailiac') + get('thigh');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.0994921 -
          0.0009929 * skinfoldsSum +
          0.0000023 * Math.pow(skinfoldsSum, 2) -
          0.0001392 * validAge;
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    }
  } else if (protocol === 'Faulkner 4 Dobras' || protocol === 'faulkner_4') {
    // Faulkner 4: Tríceps, Subescapular, Supra-ilíaca, Abdominal
    skinfoldsSum = get('triceps') + get('subscapular') + get('suprailiac') + get('abdominal');
    if (skinfoldsSum > 0) {
      const fat = skinfoldsSum * 0.153 + 5.783;
      bodyFatPercentage = Math.min(Math.max(Number(fat.toFixed(2)), 3.0), 65.0);
    }
  } else if (protocol === 'Petroski 4 Dobras' || protocol === 'petroski_4') {
    // Petroski: Homens = Subescapular, Tríceps, Supra-ilíaca, Panturrilha; Mulheres = Axilar Média, Supra-ilíaca, Coxa, Panturrilha
    if (gender === 'M') {
      skinfoldsSum = get('subscapular') + get('triceps') + get('suprailiac') + get('calf');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.10726863 -
          0.00081201 * skinfoldsSum +
          0.00000212 * Math.pow(skinfoldsSum, 2) -
          0.00041761 * validAge;
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    } else {
      skinfoldsSum = get('midaxillary') + get('suprailiac') + get('thigh') + get('calf');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.098792 -
          0.0006207 * skinfoldsSum +
          0.0000015 * Math.pow(skinfoldsSum, 2) -
          0.0001859 * validAge;
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    }
  } else if (protocol === 'Guedes 3 Dobras' || protocol === 'guedes_3') {
    // Guedes: Homens = Tríceps, Supra-ilíaca, Abdômen; Mulheres = Subescapular, Supra-ilíaca, Coxa
    if (gender === 'M') {
      skinfoldsSum = get('triceps') + get('suprailiac') + get('abdominal');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.17136 - 0.06706 * Math.log10(skinfoldsSum);
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    } else {
      skinfoldsSum = get('subscapular') + get('suprailiac') + get('thigh');
      if (skinfoldsSum > 0) {
        bodyDensity =
          1.16687 - 0.07059 * Math.log10(skinfoldsSum);
        bodyFatPercentage = siriFormula(bodyDensity);
      }
    }
  } else {
    // Bioimpedância ou Básico
    bodyFatPercentage = gender === 'M' ? 18.0 : 24.0;
  }

  bodyFatPercentage = Number(bodyFatPercentage.toFixed(2));
  const fatMass = Number(((weight * bodyFatPercentage) / 100).toFixed(2));
  const leanMass = Number((weight - fatMass).toFixed(2));

  return {
    bmi,
    bmiClassification,
    bodyFatPercentage,
    fatMass,
    leanMass,
    bodyDensity: bodyDensity ? Number(bodyDensity.toFixed(4)) : undefined,
    skinfoldsSum: skinfoldsSum > 0 ? Number(skinfoldsSum.toFixed(1)) : 0,
  };
}
