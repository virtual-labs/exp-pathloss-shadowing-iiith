Link budget is an important aspect of wireless communication systems design. It accounts for all gains and losses. Two major factors that cause a variation in the received signal(loss) are Pathloss and shadowing. Thus, an accurate characterization of these two effects is crucial for planning the link budget. Let us now understand these effects in detail.

## Pathloss
Pathloss is a measure of signal attenuation (i.e. reduction in received signal power) along its path from the $T_{X}$ to $R_{X}$. Mathematically, linear pathloss is defined as the ratio of the transmit power to received power given as

$$
\begin{aligned}
PL = \frac{P_{t}}{P_{r}}
\end{aligned}
$$

$$
\begin{aligned}
PL(\text{in dB}) = 10~ \log_{10} \frac{P_t}{P_{r}}
\end{aligned}
$$

In general, the recieved power $P_r$ is dependent on the following factors:
- Antenna gains of $T_X$ and $R_X$, $G_t$ and $G_r$ respectively. Antenna gain measures the efficiency of an antenna to focus the signal energy in a specific direction. We can say that a direction-specific antenna(the one with higher G) leads to a increase in $P_r$.
- Distance between the $T_{x}$ and $R_{x}$, $d$. The recieved power decreases with distance. 
- Signal wavelength, $\lambda$. Signals with higher wavelengths travel effectively over longer distances and can also bend around obstacles due to their low carrier frequency. This indicates that $P_r$ increases.

From the Friis free-space transmission equation,

$$
P_r = P_t~ G \left(\frac{\lambda}{4\pi d}\right)^2
$$

where, $G_{t} G_{r}=\sqrt{G}$ is the combined antenna gain.

The above expression for recieved power is in coherence with our understanding.

we can now express Pathloss as

$$
\begin{aligned}
PL(\text{in dB}) = 10~ \log _{10}\left(\frac{4 \pi d}{\lambda \sqrt{G}}\right)^{2},
\end{aligned}
$$


## Pathloss with shadowing
Now, after clearly understanding the concept of pathloss, have you wondered if the pathloss in any direction of the same distance is equal? Not necessarily. This is due to the effect of shadowing! Not just the distance between the $T_{X}$ and $R_{X}$, but also the propogation environment, containing obstacles that lead to absorption, reflection, and scattering etc of the signal leads to an attenuation of the received signal power. This attenuation is a random value. This leads to an additional term in the pathloss equation as follows

$$
\begin{aligned}
PL(\text{in dB})= 10 \log _{10}\left(\frac{4 \pi d}{\lambda \sqrt{G}}\right)^{2}+\psi
\end{aligned}
$$

The most common model for this additional attenuation, $\psi$, is log-normal shadowing. This model has been empirically confirmed to accurately capture the variation in received signal power in both outdoor and indoor radio propagation environments.

$$
\begin{aligned}
p_\psi(\psi)=\frac{\varepsilon}{\sqrt{2 \pi} \sigma_{\psi_{d B}} \psi} \cdot \exp \left[\frac{-\left(10 \log_{10} \psi-\mu_{\psi d B}\right)^{2}}{2 \sigma_{d}^{2}}\right],
\end{aligned}
$$

where $\xi=\frac{10}{\ln 10}$, $\mu_{\psi_{\text{in dB}}}$ is the mean and $\sigma_{\psi_{\text{in dB}}}^{2}$ is the variance.
