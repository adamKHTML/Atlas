<?php

namespace App\Entity;

use App\Repository\CountryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CountryRepository::class)]
class Country
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $code = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $flag_url = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    /**
     * @var Collection<int, Content>
     */
    #[ORM\OneToMany(targetEntity: Content::class, mappedBy: 'country')]
    private Collection $Content;

    /**
     * @var Collection<int, Discussion>
     */
    #[ORM\OneToMany(targetEntity: Discussion::class, mappedBy: 'country')]
    private Collection $Discussion;

    /**
     * @var Collection<int, Quiz>
     */
    #[ORM\OneToMany(targetEntity: Quiz::class, mappedBy: 'country')]
    private Collection $Quiz;

    /**
     * @var Collection<int, Analytics>
     */
    #[ORM\OneToMany(targetEntity: Analytics::class, mappedBy: 'Country')]
    private Collection $analytics;

    #[ORM\Column(length: 255)]
    private ?string $country_image = null;

    public function __construct()
    {
        $this->Content = new ArrayCollection();
        $this->Discussion = new ArrayCollection();
        $this->Quiz = new ArrayCollection();
        $this->analytics = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(?string $code): static
    {
        $this->code = $code;

        return $this;
    }

    public function getFlagUrl(): ?string
    {
        return $this->flag_url;
    }

    public function setFlagUrl(?string $flag_url): static
    {
        $this->flag_url = $flag_url;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }

    /**
     * @return Collection<int, Content>
     */
    public function getContent(): Collection
    {
        return $this->Content;
    }

    public function addContent(Content $content): static
    {
        if (!$this->Content->contains($content)) {
            $this->Content->add($content);
            $content->setCountry($this);
        }

        return $this;
    }

    public function removeContent(Content $content): static
    {
        if ($this->Content->removeElement($content)) {
            // set the owning side to null (unless already changed)
            if ($content->getCountry() === $this) {
                $content->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Discussion>
     */
    public function getDiscussion(): Collection
    {
        return $this->Discussion;
    }

    public function addDiscussion(Discussion $discussion): static
    {
        if (!$this->Discussion->contains($discussion)) {
            $this->Discussion->add($discussion);
            $discussion->setCountry($this);
        }

        return $this;
    }

    public function removeDiscussion(Discussion $discussion): static
    {
        if ($this->Discussion->removeElement($discussion)) {
            // set the owning side to null (unless already changed)
            if ($discussion->getCountry() === $this) {
                $discussion->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Quiz>
     */
    public function getQuiz(): Collection
    {
        return $this->Quiz;
    }

    public function addQuiz(Quiz $quiz): static
    {
        if (!$this->Quiz->contains($quiz)) {
            $this->Quiz->add($quiz);
            $quiz->setCountry($this);
        }

        return $this;
    }

    public function removeQuiz(Quiz $quiz): static
    {
        if ($this->Quiz->removeElement($quiz)) {
            // set the owning side to null (unless already changed)
            if ($quiz->getCountry() === $this) {
                $quiz->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Analytics>
     */
    public function getAnalytics(): Collection
    {
        return $this->analytics;
    }

    public function addAnalytic(Analytics $analytic): static
    {
        if (!$this->analytics->contains($analytic)) {
            $this->analytics->add($analytic);
            $analytic->setCountry($this);
        }

        return $this;
    }

    public function removeAnalytic(Analytics $analytic): static
    {
        if ($this->analytics->removeElement($analytic)) {
            // set the owning side to null (unless already changed)
            if ($analytic->getCountry() === $this) {
                $analytic->setCountry(null);
            }
        }

        return $this;
    }

    public function getCountryImage(): ?string
    {
        return $this->country_image;
    }

    public function setCountryImage(string $country_image): static
    {
        $this->country_image = $country_image;

        return $this;
    }
}
