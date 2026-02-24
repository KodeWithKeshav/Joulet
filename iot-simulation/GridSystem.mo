model GridSystem "Grid Simulation with Noise and Load"
  import Modelica.Electrical.Analog.Sources;
  import Modelica.Electrical.Analog.Basic;
  import Modelica.Electrical.Analog.Sensors;
  import Modelica.Blocks.Sources.Trapezoid;
  import Modelica.Blocks.Noise.NormalNoise;

  // Components
  Sources.SineVoltage gridSource(V=325.27, freqHz=50, phase=0) "230V RMS = 325.27V Peak";
  Sources.SignalVoltage noiseInjection;
  
  Basic.VariableResistor load;
  Sensors.PowerSensor powerSensor;
  Basic.Ground ground;

  // Signal Sources
  Trapezoid loadProfile(amplitude=50, rising=3600, width=14400, falling=3600, period=86400, offset=10);
  NormalNoise gridNoise(mu=0, sigma=20, samplePeriod=0.1); 

equation 
  // Connections
  connect(gridSource.n, ground.p);
  connect(gridSource.p, noiseInjection.n);
  connect(noiseInjection.p, powerSensor.pc);
  
  connect(powerSensor.pv, noiseInjection.p); // Measure voltage after noise
  connect(powerSensor.nc, load.p);
  connect(powerSensor.nv, ground.p); // Voltage relative to ground
  connect(load.n, ground.p);

  // Control Signals
  connect(gridNoise.y, noiseInjection.v);
  connect(loadProfile.y, load.R);

end GridSystem;
