Link budget is an important aspect of wireless communication systems design. It accounts for all gains and losses. Two major factors that cause a variation in the received signal(loss) are Pathloss and shadowing. Thus, an accurate characterization of these two effects is crucial for planning the link budget. Let us now understand these effects in detail.

## Pathloss
Pathloss is a measure of signal attenuation along its path from the $T_{x}$ and $R_{x}$. This leads to a reduction in signal received signal power. In general, we can say that pathloss is dependent on the following factors:
1) Total recieved power $P_r$ w.r.t the total transmit power $P_t$. Intuitively, if $P_r$ is high, then the pathloss is low.
2) Antenna gains of $T_x$ and $R_x$, $G_t$ and $G_r$ respectively. Antenna gain measures the efficiency of an antenna to focus the signal energy in a specific direction. Intuitively, we can say that a direction-specific antenna(the one with higher G) leads to a reduction in pathloss.
3) Distance between the $T_{x}$ and $R_{x}$, $d$. From the definition of pathloss, We can clearly understand that pathloss increases with an increase in the distance. 
4) Signal wavelength, $\lambda$. This is an important factor when considering how far the signal can travel effectively. Signals with higher wavelengths travel effectively over longer distances and can also bend around obstacles due to their low carrier frequency. This indicates that Pathloss reduces with wavelength.

Mathematically, linear pathloss is defined as the ratio of the transmit power to received power given as
```math
     PL= \frac{P_{t}}{P_{r}} 
```
```math
     PL(\text{in dB})  = 10 \log _{10} \frac{P_{t}}{P_{r}}
```
From the FrIis free-space transmission equation, w.k.t
```math
    PL(\text{in dB}) = 10 \log _{10}\left(\frac{4 \pi d}{\lambda \sqrt{G}}\right)^{2},
```
where $ G_{t} G_{r}=\sqrt{G}$ is the combined antenna gain.

We can clearly see that the intuitive understanding is in coherence with the derived formula.

## Pathloss with shadowing
Now, after clearly understanding the concept of pathloss, have you wondered if the pathloss in any direction of the same distance is equal? Not necessarily. This gives rise to the effect of shadowing! Not just the distance between the $T_{x}$ and $R_{x}$, but also the surrounding environment b/w them leads to an attenuation of the received signal power. Shadowing is caused by the obstacles between the $T_{x}$ and $R_{x}$ that lead to absorption, reflection, and scattering etc of the signal. The attenuation due to this is a random value. This leads to an additional term in the pathloss equation as follows
```math
    PL(\text{in dB})= 10 \log _{10}\left(\frac{4 \pi d}{\lambda \sqrt{G}}\right)^{2}+\psi
```
The most common model for this additional attenuation, $\psi$ is log-normal shadowing. This model has been empirically confirmed to accurately capture the variation in received signal power in both outdoor and indoor radio propagation environments.
```math
     P(\psi)=\frac{\varepsilon}{\sqrt{2 \pi} \sigma_{\psi_{d B}} \psi} \cdot \exp \left[\frac{-\left(10 \log_{10} \psi-\mu_{\psi d B}\right)^{2}}{2 \sigma_{d}^{2}}\right],
```
where $\xi=\frac{10}{\ln 10}$, $\mu_{\psi_{\text{in dB}}}$ is the mean and $\sigma_{\psi_{\text{in dB}}}^{2}$ is the variance.
