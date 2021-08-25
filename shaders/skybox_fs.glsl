#version 300 es

precision mediump float;

in vec4 v_pos;

uniform samplerCube u_texture;

out vec4 outColor;
 
void main() {
    vec4 rgba = texture(u_texture, normalize(v_pos.xyz / v_pos.w));

    outColor = vec4(rgba.rgb, 1.0);
}