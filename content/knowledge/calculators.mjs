export function scaleModel({homes,adoption,kwh,price,months}) {
  if (![homes,adoption,kwh,price,months].every(Number.isFinite) || homes<=0 || homes>100 || adoption<0 || adoption>100 || kwh<=0 || kwh>1000 || price<0 || price>1000000 || months<=0 || months>1200) throw new Error('Enter a valid base (up to 100 million homes), 0–100% adoption, positive capacity and duration, and a nonnegative price.');
  const installations=homes*1e6*adoption/100;
  return {installations,gwh:installations*kwh/1e6,billions:installations*price/1e9,monthly:installations/months};
}
export function backupModel({kwh,charge,reserve,load}) {
  if (![kwh,charge,reserve,load].every(Number.isFinite) || kwh<=0 || kwh>1000 || charge<0 || charge>100 || reserve<0 || reserve>100 || load<=0 || load>1000) throw new Error('Enter positive usable energy and average load, and charge and reserve between 0% and 100%.');
  if (reserve>charge) throw new Error('The reserve is above the starting charge. Lower the reserve or raise the starting charge.');
  const available=kwh*(charge-reserve)/100;
  return {available,hours:available/load};
}
