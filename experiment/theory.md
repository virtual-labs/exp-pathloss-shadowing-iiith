Link budget is an important aspect of wireless communication systems design. Two major factors that cause a spatial variation  in the received signal are Pathloss and shadowing. Thus, an accurate modeling of pathloss and shadowing that accounts for other important parameters like antenna gains, transmission powers, propogation parameters, frequency becomes crucial for planning the link budget. Let us now understand these models in detail.

## Pathloss Model
Pathloss is a measure of signal attenuation (i.e. reduction in received signal power) along its path from the $T_{X}$ to $R_{X}$. Linear pathloss is defined as the ratio of the transmit power to received power given as

$$
\begin{aligned}
    PL = \frac{P_{t}}{P_{r}}
\end{aligned}
$$

$$
\begin{aligned}
    PL ~(\text{dB}) = 10~ \log_{10} \frac{P_t}{P_{r}}
\end{aligned}
$$

In general, the recieved power $P_r$ is dependent on the following factors:
- Antenna gains of $T_X$ and $R_X$, $G_t$ and $G_r$ respectively. Antenna gain measures the efficiency of an antenna to focus the signal energy in a specific direction.
- Distance between the $T_{x}$ and $R_{x}$, i.e. $d$. The recieved power decreases with distance. 
- Effective aperture of the recieving antenna $A_e = G_r\frac{\lambda}{4\pi^2}$ whivh increases with the signal wavelength $\lambda$


In the free-space , the recieved power at a distance $d$ is product of Power density $P_d$ at d and recieving antenna aperture and can be modeled as,

$$
\begin{aligned}
    P_r = P_d A_e = P_t~ G \left(\frac{\lambda}{4\pi d}\right)^2
\end{aligned}
$$

where $G = G_{t} G_{r}$ is the combined antenna gain.

The above pathloss model is known as Friis pathloss model. Free-space pathloss in dB can be expressed as

$$
\begin{aligned}
    PL(\text{in dB}) = 10~ \log _{10}\left(\frac{4 \pi d}{\lambda \sqrt{G}}\right)^{2},
\end{aligned}
$$


## Pathloss with shadowing
Given these pathloss models, have you wondered if the pathloss in any direction at the same distance is equal? Not necessarily. The attenuation of the recieved signal power is not just due to the distance between the $T_X$ and $R_X$, but also because of the propogation environment containing obstacles that lead to absorption, reflection, and scattering of the signal. This leads to an additional term in the pathloss equation as follows

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

We can view the visual illustration of Pathloss and shadowing in the below figure.

<p align="center">
<img src="./images/exp1.png" width="430">
</p>
