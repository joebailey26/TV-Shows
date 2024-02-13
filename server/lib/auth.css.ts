export default `body.__next-auth-theme-auto,
body.__next-auth-theme-light,
body.__next-auth-theme-dark {
  --color-background-card: rgb(255 255 255 / 50%);
  --color-info: #164863;
  --color-info-hover: #427D9D
}
.page {
  display: flex;
  align-items: center;
  padding: 4rem 1rem;
  background-image: linear-gradient(rgb(0 0 0 / 50%), rgb(0 0 0 / 50%)), url('https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=1920&auto=format&fit=crop');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover
}
.page > * {
  width: 100%;
  max-width: 1400px;
  margin-right: auto;
  margin-left: auto
}
.card {
  width: 100%;
  max-width: 600px;
  margin: 0;
  margin-top: -4rem;
  border-radius: 1rem;
  backdrop-filter: blur(5px)
}
.signin hr:before {
  padding: 0 .4rem .2rem;
  background-color: white;
  border-radius: .33rem
}
`
