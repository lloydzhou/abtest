

// https://gist.github.com/izaac/daf81344fe6061c82172
export function getZPercent(z)
{
    // http://stackoverflow.com/questions/16194730/seeking-a-statistical-javascript-function-to-return-p-value-from-a-z-score
    //z == number of standard deviations from the mean

    //if z is greater than 6.5 standard deviations from the mean
    //the number of significant digits will be outside of a reasonable
    //range
    if ( z < -6.5)
        return 0.0;
    if( z > 6.5)
        return 1.0;

    var factK = 1;
    var sum = 0;
    var term = 1;
    var k = 0;
    var loopStop = Math.exp(-23);
    while(Math.abs(term) > loopStop)
    {
        term = 0.3989422804 * Math.pow(-1,k) * Math.pow(z,k) / (2 * k + 1) / Math.pow(2,k) * Math.pow(z,k+1) / factK;
        sum += term;
        k++;
        factK *= k;
    }
    sum += 0.5;

    return sum;
}

export function ZScore(mean1, std1, n1, mean2, std2, n2) {
  // d = y1 - y2
  // d / math.sqrt(sd1^2 / n1 + sd2^2 / n2)
  return (mean1 - mean2) / Math.sqrt(std1 * std1 / n1 + std2 * std2 / n2)
  //return (mean1 - mean2) / (Math.sqrt(std1 * std1 / (n1||1) + std2 * std2 / (n2||1)) ||1)
}
export function realMeanStd (mean, std, user, uv) {
    // 服务端统计的实际是uv的均值和方差，以及target的均值和方差
    // 实际上统计需要的均值方差是target的总值针对uv计算出的均值和方差
    // -- S(n) = S(n-1) + (x(n) - E(n-1))(x(n) - E(n-1))
    // count = count + 1
    // s = s + 1.0 * (count - 1) / count * (score - mean) * (score - mean)
    // mean = mean + 1.0 * (score - mean) / count
    // console.log(mean, std, user, uv)
    let real_mean = mean
    let real_s = (std * std) * (user - 1)
    for (let i = user; i < uv; i++) {
      const score = 0;
      const count = i + 1
      real_s = real_s + (count - 1) / count * (score - real_mean) * (score - real_mean);
      real_mean = real_mean + (score - real_mean) / count;
      // console.log(real_mean, real_s, i)
    }
    const real_std = Math.sqrt(real_s / (uv - 1))
    // console.log(real_mean, real_std, user, uv, mean * user / uv)
    return [real_mean, real_std, uv]
  }

